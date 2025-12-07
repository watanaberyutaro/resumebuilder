import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendScoutNotification } from '@/lib/notifications/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Verify user is a company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: '企業アカウントのみ利用可能です' }, { status: 403 });
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: '企業情報が見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const { recipientUserId, recipientResumeId, subject, message, positionTitle, salaryRange } = body;

    if (!recipientUserId || !subject || !message) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // Check if recipient has blocked this company
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('blocked_company_ids, scout_enabled')
      .eq('id', recipientUserId)
      .single();

    if (!recipientProfile?.scout_enabled) {
      return NextResponse.json({ error: 'この候補者はスカウトを受け付けていません' }, { status: 400 });
    }

    if (recipientProfile?.blocked_company_ids?.includes(company.id)) {
      return NextResponse.json({ error: 'この候補者にスカウトを送信できません' }, { status: 400 });
    }

    // Check for duplicate offers
    const { data: existingOffer } = await supabase
      .from('offers')
      .select('id')
      .eq('company_id', company.id)
      .eq('recipient_user_id', recipientUserId)
      .not('status', 'in', '("declined", "hired")')
      .single();

    if (existingOffer) {
      return NextResponse.json({ error: 'この候補者には既にスカウトを送信済みです' }, { status: 400 });
    }

    // Create offer
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        company_id: company.id,
        sender_user_id: user.id,
        recipient_user_id: recipientUserId,
        recipient_resume_id: recipientResumeId,
        subject,
        message,
        position_title: positionTitle,
        salary_range: salaryRange,
        status: 'pending',
      })
      .select()
      .single();

    if (offerError) {
      throw new Error(`Failed to create offer: ${offerError.message}`);
    }

    // Send notification
    await sendScoutNotification(recipientUserId, company.company_name, offer.id);

    return NextResponse.json({
      success: true,
      offerId: offer.id,
    });
  } catch (error) {
    console.error('Send offer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'スカウト送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
