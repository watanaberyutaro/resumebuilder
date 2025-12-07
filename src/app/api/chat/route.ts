import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { editWithChat } from '@/lib/openai/resume-generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, message, currentContent, contentType } = body;

    if (!message) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 });
    }

    let chatSessionId = sessionId;

    // Create or get chat session
    if (!chatSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50),
          current_step: 'education',
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create chat session: ${sessionError.message}`);
      }

      chatSessionId = newSession.id;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: chatSessionId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // Get chat history for context
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', chatSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    // If editing content, use the edit function
    if (currentContent && contentType) {
      const chatHistory = history
        ?.filter(h => h.role !== 'system')
        .map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })) || [];

      const result = await editWithChat({
        currentContent,
        userInstruction: message,
        contentType,
        chatHistory,
      });

      // Save assistant response
      await supabase.from('chat_messages').insert({
        session_id: chatSessionId,
        user_id: user.id,
        role: 'assistant',
        content: JSON.stringify({
          editedContent: result.editedContent,
          explanation: result.explanation,
        }),
        tokens_used: result.usage.inputTokens + result.usage.outputTokens,
      });

      // Log the generation
      await supabase.from('ai_generations').insert({
        user_id: user.id,
        generation_type: 'chat',
        prompt: message,
        response: result.editedContent,
        model: 'gpt-4o-mini',
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        cost_jpy: result.usage.costJPY,
      });

      return NextResponse.json({
        success: true,
        sessionId: chatSessionId,
        response: {
          editedContent: result.editedContent,
          explanation: result.explanation,
        },
        usage: result.usage,
      });
    }

    // For general chat, return a simple response
    return NextResponse.json({
      success: true,
      sessionId: chatSessionId,
      response: {
        message: 'チャットセッションが作成されました。編集したい内容と指示を一緒に送信してください。',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'チャット処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session messages
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
      }

      return NextResponse.json({ messages });
    }

    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { error: 'チャット履歴の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
