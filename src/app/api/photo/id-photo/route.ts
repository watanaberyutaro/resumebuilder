import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { briaClient } from '@/lib/bria';
import { suitGenerator } from '@/lib/openai';
import sharp from 'sharp';

// ID photo size (3cm x 4cm @ 300DPI)
const ID_PHOTO_WIDTH = 354;
const ID_PHOTO_HEIGHT = 472;
const BACKGROUND_COLOR = '#B0D4E8'; // Light blue

type SuitType = 'male' | 'female';

interface IDPhotoRequest {
  photoUrl: string;
  suitType: SuitType;
  resumeId?: string;
}

async function compositeIDPhoto(
  foregroundBuffer: Buffer,
  suitType: SuitType
): Promise<Buffer> {
  // Parse background color
  const hex = BACKGROUND_COLOR.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Resize foreground to fit within ID photo dimensions
  // Auto-rotate based on EXIF orientation, then resize
  const resizedForeground = await sharp(foregroundBuffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(ID_PHOTO_WIDTH, ID_PHOTO_HEIGHT, {
      fit: 'inside',
      position: 'center',
      withoutEnlargement: false,
    })
    .toBuffer();

  // Create background with solid color
  const background = await sharp({
    create: {
      width: ID_PHOTO_WIDTH,
      height: ID_PHOTO_HEIGHT,
      channels: 4,
      background: { r, g, b, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  // Calculate position to center the person
  const resizedMeta = await sharp(resizedForeground).metadata();
  const personWidth = resizedMeta.width || ID_PHOTO_WIDTH;
  const personHeight = resizedMeta.height || ID_PHOTO_HEIGHT;
  const personLeft = Math.round((ID_PHOTO_WIDTH - personWidth) / 2);
  const personTop = Math.round((ID_PHOTO_HEIGHT - personHeight) / 2);

  // Generate AI suit overlay
  let suitBuffer: Buffer | null = null;

  // Check if suit generator is configured
  if (suitGenerator.isConfigured()) {
    try {
      console.log('Generating AI suit overlay...');
      const suitResult = await suitGenerator.generateSuitAsBuffer(suitType);

      if (suitResult.success) {
        suitBuffer = suitResult.buffer;
        console.log('AI suit generated successfully');
      } else {
        console.warn('Suit generation failed:', suitResult.error);
      }
    } catch (error) {
      console.warn('Suit generation error:', error);
    }
  } else {
    console.warn('OpenAI API not configured, skipping suit overlay');
  }

  // Composite layers
  const composites: { input: Buffer; top: number; left: number }[] = [
    { input: resizedForeground, top: personTop, left: personLeft },
  ];

  // Add suit overlay if available
  if (suitBuffer) {
    // Resize suit to fit width
    const resizedSuit = await sharp(suitBuffer)
      .resize(ID_PHOTO_WIDTH, null, { fit: 'inside' })
      .toBuffer();

    const suitMeta = await sharp(resizedSuit).metadata();
    const suitHeight = suitMeta.height || 200;

    composites.push({
      input: resizedSuit,
      top: ID_PHOTO_HEIGHT - suitHeight,
      left: 0,
    });
  }

  // Final composite
  const result = await sharp(background)
    .composite(composites)
    .jpeg({ quality: 95 })
    .toBuffer();

  return result;
}

async function uploadToSupabase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  buffer: Buffer,
  filename: string
): Promise<string> {
  const storagePath = `${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from('resume-photos')
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('resume-photos')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json() as IDPhotoRequest;
    const { photoUrl, suitType, resumeId } = body;

    // Validation
    if (!photoUrl) {
      return NextResponse.json({ error: '写真URLが必要です' }, { status: 400 });
    }

    if (!suitType || !['male', 'female'].includes(suitType)) {
      return NextResponse.json({ error: 'スーツタイプ (male/female) が必要です' }, { status: 400 });
    }

    // Check if Bria API is configured
    if (!briaClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Bria APIが設定されていません。管理者にお問い合わせください。' },
        { status: 503 }
      );
    }

    console.log('ID Photo generation started:', { photoUrl, suitType, resumeId });

    // Step 1: Remove background using Bria API
    const bgRemovalResult = await briaClient.removeBackgroundAsBuffer(photoUrl);

    if (!bgRemovalResult.success) {
      console.error('Background removal failed:', bgRemovalResult.error);
      return NextResponse.json(
        { error: `背景除去に失敗しました: ${bgRemovalResult.error}` },
        { status: 500 }
      );
    }

    // Step 2: Composite ID photo (add background color and suit)
    const idPhotoBuffer = await compositeIDPhoto(bgRemovalResult.buffer, suitType);

    // Step 3: Upload to Supabase Storage
    const timestamp = Date.now();
    const filename = `${timestamp}_id_photo.jpg`;
    const processedUrl = await uploadToSupabase(supabase, user.id, idPhotoBuffer, filename);

    // Step 4: Update database
    if (resumeId) {
      const { error: updateError } = await supabase
        .from('resumes')
        .update({ photo_processed_url: processedUrl })
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating resume:', updateError);
      }
    }

    // Step 5: Create photo job record
    const { data: photoJob, error: jobError } = await supabase
      .from('photo_jobs')
      .insert({
        user_id: user.id,
        resume_id: resumeId || null,
        original_url: photoUrl,
        processed_url: processedUrl,
        processing_options: {
          remove_background: true,
          background_color: BACKGROUND_COLOR,
          add_suit: true,
          suit_type: suitType,
        },
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating photo job:', jobError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`ID Photo generated successfully in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      processedUrl,
      jobId: photoJob?.id,
      processingTime,
      message: '証明写真の作成が完了しました',
    });
  } catch (error) {
    console.error('ID Photo generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '証明写真の作成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
