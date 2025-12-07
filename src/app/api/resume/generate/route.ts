import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResumeContent } from '@/lib/openai/resume-generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { resumeId, language = 'ja' } = body;

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeIdが必要です' }, { status: 400 });
    }

    // Fetch resume data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: '履歴書が見つかりません' }, { status: 404 });
    }

    // Fetch work histories
    const { data: workHistories } = await supabase
      .from('work_histories')
      .select('*')
      .eq('resume_id', resumeId)
      .order('display_order');

    // Fetch skills
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .eq('resume_id', resumeId);

    // Generate content with AI
    const result = await generateResumeContent({
      resume,
      workHistories: workHistories || [],
      skills: skills || [],
      language: language === 'en' ? '英語' : '日本語',
    });

    // Update resume with generated content
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        ai_summary: result.content.summary,
        ai_self_pr: result.content.selfPR,
        ai_career_objective: result.content.careerObjective,
        last_generated_at: new Date().toISOString(),
      })
      .eq('id', resumeId);

    if (updateError) {
      console.error('Failed to update resume:', updateError);
    }

    // Update work histories with AI descriptions
    for (const wd of result.content.workDescriptions) {
      await supabase
        .from('work_histories')
        .update({
          ai_description: wd.description,
          ai_achievements: wd.achievements,
        })
        .eq('id', wd.workHistoryId);
    }

    // Log the generation
    await supabase.from('ai_generations').insert({
      user_id: user.id,
      resume_id: resumeId,
      generation_type: 'summary',
      prompt: 'Full resume generation',
      response: JSON.stringify(result.content),
      model: 'gpt-4o-mini',
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      cost_jpy: result.usage.costJPY,
    });

    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: '生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
