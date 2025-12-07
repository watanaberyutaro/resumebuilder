import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { ResumeDocument } from '@/lib/pdf/resume-template';

// Force Node.js runtime (required for @react-pdf/renderer)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for PDF generation

export async function GET(request: NextRequest) {
  try {
    console.log('PDF generation started (@react-pdf/renderer)');
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get('resumeId');
    const template = searchParams.get('template') as 'jis' | 'modern' | 'engineer' || 'jis';

    console.log('PDF params:', { resumeId, template, userId: user.id });

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeIdが必要です' }, { status: 400 });
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      console.error('Resume fetch error:', resumeError);
      return NextResponse.json({ error: '履歴書が見つかりません' }, { status: 404 });
    }

    console.log('Resume found:', { id: resume.id, name: resume.full_name });

    // Fetch work histories
    const { data: workHistories, error: workError } = await supabase
      .from('work_histories')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order');

    if (workError) {
      console.error('Work histories fetch error:', workError);
    }
    console.log('Work histories found:', workHistories?.length || 0);

    // Fetch skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', user.id);

    if (skillsError) {
      console.error('Skills fetch error:', skillsError);
    }
    console.log('Skills found:', skills?.length || 0);

    // Generate PDF using @react-pdf/renderer
    console.log('Generating PDF with @react-pdf/renderer...');
    const pdfBuffer = await renderToBuffer(
      <ResumeDocument
        resume={resume}
        workHistories={workHistories || []}
        skills={skills || []}
        templateType={template}
      />
    );

    console.log('PDF generated, size:', pdfBuffer.length);

    // Return PDF
    const fileName = resume.full_name || 'resume';
    const encodedFileName = encodeURIComponent(fileName);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume.pdf"; filename*=UTF-8''${encodedFileName}.pdf`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        error: 'PDF生成中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
