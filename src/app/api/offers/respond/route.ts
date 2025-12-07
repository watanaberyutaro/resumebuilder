import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendNotification } from '@/lib/notifications/service';
import { recordSuccessfulHire, SCOUT_SUCCESS_FEE_JPY } from '@/lib/billing/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, status, response: candidateResponse } = body;

    if (!offerId || !status) {
      return NextResponse.json({ error: 'オファーIDとステータスが必要です' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['interested', 'declined', 'accepted'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
    }

    // Get offer and verify ownership
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        companies (
          id,
          company_name,
          user_id
        )
      `)
      .eq('id', offerId)
      .eq('recipient_user_id', user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'オファーが見つかりません' }, { status: 404 });
    }

    // Update offer
    const updateData: Record<string, unknown> = {
      status,
      status_changed_at: new Date().toISOString(),
    };

    if (candidateResponse) {
      updateData.candidate_response = candidateResponse;
    }

    // If interested or accepted, disclose contact info
    if (status === 'interested' || status === 'accepted') {
      updateData.is_contact_disclosed = true;
      updateData.disclosed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', offerId);

    if (updateError) {
      throw new Error(`Failed to update offer: ${updateError.message}`);
    }

    // Notify company
    const company = offer.companies as { id: string; company_name: string; user_id: string };
    const statusMessages: Record<string, string> = {
      interested: '候補者が興味を示しました',
      declined: '候補者が辞退しました',
      accepted: '候補者がオファーを受諾しました',
    };

    await sendNotification({
      userId: company.user_id,
      type: 'message',
      title: 'スカウト回答',
      message: `${offer.subject}への${statusMessages[status]}`,
      relatedEntityType: 'offer',
      relatedEntityId: offerId,
      channels: { app: true, email: true },
    });

    // If accepted, this might lead to a hire - create billing event
    // Note: In production, this should be confirmed separately
    if (status === 'accepted') {
      // For now, just log. In production, implement a "hired" confirmation flow
      console.log('Offer accepted - potential hire pending confirmation');
    }

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Respond to offer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '回答の処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// Endpoint for company to confirm hire
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId } = body;

    if (!offerId) {
      return NextResponse.json({ error: 'オファーIDが必要です' }, { status: 400 });
    }

    // Get offer and verify company ownership
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select(`
        *,
        companies (
          id,
          company_name,
          user_id
        )
      `)
      .eq('id', offerId)
      .eq('sender_user_id', user.id)
      .single();

    if (offerError || !offer) {
      return NextResponse.json({ error: 'オファーが見つかりません' }, { status: 404 });
    }

    if (offer.status !== 'accepted') {
      return NextResponse.json({ error: 'このオファーは採用確定できません' }, { status: 400 });
    }

    // Update status to hired
    const { error: updateError } = await supabase
      .from('offers')
      .update({
        status: 'hired',
        status_changed_at: new Date().toISOString(),
      })
      .eq('id', offerId);

    if (updateError) {
      throw new Error(`Failed to update offer: ${updateError.message}`);
    }

    // Create billing event
    const company = offer.companies as { id: string; company_name: string; user_id: string };
    const billingResult = await recordSuccessfulHire({
      companyId: company.id,
      offerId,
      amount: SCOUT_SUCCESS_FEE_JPY,
    });

    if (!billingResult.success) {
      console.error('Failed to create billing event:', billingResult.error);
    }

    return NextResponse.json({
      success: true,
      status: 'hired',
      billingEventId: billingResult.billingEventId,
    });
  } catch (error) {
    console.error('Confirm hire error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '採用確定の処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
