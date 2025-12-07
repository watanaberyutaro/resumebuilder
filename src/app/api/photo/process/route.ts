import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { photoEditService } from '@/lib/photo';
import type { PhotoProcessingOptions } from '@/lib/photo/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const optionsStr = formData.get('options') as string | null;
    const resumeId = formData.get('resumeId') as string | null;

    if (!file) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 });
    }

    // Parse processing options
    const options: PhotoProcessingOptions = optionsStr
      ? JSON.parse(optionsStr)
      : { cropToIDPhoto: true };

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload original to Supabase Storage
    const originalFileName = `${user.id}/${Date.now()}_original_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('resume-photos')
      .upload(originalFileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload original: ${uploadError.message}`);
    }

    const { data: originalUrlData } = supabase.storage
      .from('resume-photos')
      .getPublicUrl(originalFileName);

    // Process the image
    const result = await photoEditService.processImage(buffer, options);

    if (!result.success || !result.processedImageBuffer) {
      throw new Error(result.error || 'Image processing failed');
    }

    // Upload processed image
    const processedFileName = `${user.id}/${Date.now()}_processed.jpg`;
    const { error: processedUploadError } = await supabase.storage
      .from('resume-photos')
      .upload(processedFileName, result.processedImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (processedUploadError) {
      throw new Error(`Failed to upload processed: ${processedUploadError.message}`);
    }

    const { data: processedUrlData } = supabase.storage
      .from('resume-photos')
      .getPublicUrl(processedFileName);

    // Create photo job record
    const { data: photoJob } = await supabase
      .from('photo_jobs')
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        original_url: originalUrlData.publicUrl,
        processed_url: processedUrlData.publicUrl,
        processing_options: options,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Update resume if resumeId provided
    if (resumeId) {
      await supabase
        .from('resumes')
        .update({
          photo_url: originalUrlData.publicUrl,
          photo_processed_url: processedUrlData.publicUrl,
        })
        .eq('id', resumeId)
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      originalUrl: originalUrlData.publicUrl,
      processedUrl: processedUrlData.publicUrl,
      jobId: photoJob?.id,
      processingTime: result.processingTime,
    });
  } catch (error) {
    console.error('Photo processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '画像処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
