import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { resumeId, resumeData, workHistories, skills } = body;

    let finalResumeId = resumeId;

    // Create or update resume
    if (resumeId) {
      // Update existing resume
      const { error: updateError } = await supabase
        .from('resumes')
        .update({
          ...resumeData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Failed to update resume: ${updateError.message}`);
      }
    } else {
      // Create new resume
      const { data: newResume, error: createError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          ...resumeData,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create resume: ${createError.message}`);
      }

      finalResumeId = newResume.id;
    }

    // Handle work histories
    if (workHistories && Array.isArray(workHistories)) {
      // Delete existing work histories for this resume
      await supabase
        .from('work_histories')
        .delete()
        .eq('resume_id', finalResumeId);

      // Insert new work histories
      if (workHistories.length > 0) {
        const workHistoryInserts = workHistories.map((wh: Record<string, unknown>, index: number) => ({
          ...wh,
          resume_id: finalResumeId,
          user_id: user.id,
          display_order: index,
        }));

        const { error: whError } = await supabase
          .from('work_histories')
          .insert(workHistoryInserts);

        if (whError) {
          console.error('Failed to insert work histories:', whError);
        }
      }
    }

    // Handle skills
    if (skills && Array.isArray(skills)) {
      // Delete existing skills for this resume
      await supabase
        .from('skills')
        .delete()
        .eq('resume_id', finalResumeId);

      // Insert new skills
      if (skills.length > 0) {
        const skillInserts = skills.map((s: Record<string, unknown>) => ({
          ...s,
          resume_id: finalResumeId,
          user_id: user.id,
        }));

        const { error: skillError } = await supabase
          .from('skills')
          .insert(skillInserts);

        if (skillError) {
          console.error('Failed to insert skills:', skillError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      resumeId: finalResumeId,
    });
  } catch (error) {
    console.error('Save resume error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
