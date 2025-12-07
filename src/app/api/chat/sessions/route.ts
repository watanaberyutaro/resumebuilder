import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: チャットセッション一覧を取得
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sessions with message count
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        current_step,
        is_completed,
        created_at,
        updated_at,
        resume_id,
        chat_messages(count)
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Transform to include message_count
    const sessionsWithCount = sessions?.map(session => ({
      ...session,
      message_count: session.chat_messages?.[0]?.count || 0,
      chat_messages: undefined, // Remove the nested object
    }));

    return NextResponse.json({ sessions: sessionsWithCount });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST: 新しいチャットセッションを作成
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, resumeId } = body;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title: title || '履歴書作成',
        resume_id: resumeId || null,
        current_step: 'education',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
