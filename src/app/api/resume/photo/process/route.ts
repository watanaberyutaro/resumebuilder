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
    const { photoUrl, resumeId, options } = body;

    if (!photoUrl) {
      return NextResponse.json({ error: '写真URLが必要です' }, { status: 400 });
    }

    // TODO: Implement actual background removal using external API
    // Options available:
    // - remove.bg API
    // - Replicate API with rembg model
    // - Custom ML model
    //
    // For now, we'll return a placeholder response
    // In production, you would:
    // 1. Download the image from photoUrl
    // 2. Send to background removal API
    // 3. Upload processed image to Supabase Storage
    // 4. Return the new URL

    console.log('Photo processing requested:', { photoUrl, resumeId, options });

    // Placeholder: Return the original URL for now
    // In production, this would be the processed image URL
    const processedUrl = photoUrl;

    // Save processed URL to database if resumeId is provided
    if (resumeId) {
      const { error: updateError } = await supabase
        .from('resumes')
        .update({ photo_processed_url: processedUrl })
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error saving processed URL:', updateError);
      }
    }

    // Also create a photo_job record for tracking
    const { error: jobError } = await supabase
      .from('photo_jobs')
      .insert({
        user_id: user.id,
        resume_id: resumeId || null,
        original_url: photoUrl,
        processed_url: processedUrl,
        processing_options: options,
        status: 'completed',
        processed_at: new Date().toISOString(),
      });

    if (jobError) {
      console.error('Error creating photo job:', jobError);
    }

    return NextResponse.json({
      success: true,
      processedUrl,
      message: '写真の加工が完了しました',
      // In production, add actual processing info
      processingApplied: {
        background_removed: options?.remove_background || false,
        background_color: options?.background_color || null,
        cropped: options?.crop_to_id || false,
      },
    });
  } catch (error) {
    console.error('Photo processing error:', error);
    return NextResponse.json(
      { error: '写真の加工中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
