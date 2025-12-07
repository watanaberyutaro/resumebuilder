'use client';

import { useState, useRef, useCallback } from 'react';
import { useResumeFormStore } from '@/store/resume-form-store';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Loader2, Crop, RefreshCw, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';
import Image from 'next/image';
import { IDPhotoGenerator } from '@/components/photo/id-photo-generator';

export function PhotoUpload() {
  const { photoUrl, photoProcessedUrl, setPhoto, resumeId } = useResumeFormStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showIDPhotoModal, setShowIDPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = photoProcessedUrl || photoUrl || previewUrl;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('ログインが必要です');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resume-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resume-photos')
        .getPublicUrl(fileName);

      setPhoto(publicUrl, null);

      // Update resume in database if resumeId exists
      if (resumeId) {
        await supabase
          .from('resumes')
          .update({ photo_url: publicUrl })
          .eq('id', resumeId);
      }

      toast.success('写真をアップロードしました');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  }, [resumeId, setPhoto]);

  const handleRemovePhoto = async () => {
    setPhoto(null, null);
    setPreviewUrl(null);

    if (resumeId) {
      const supabase = createClient();
      await supabase
        .from('resumes')
        .update({ photo_url: null, photo_processed_url: null })
        .eq('id', resumeId);
    }

    toast.success('写真を削除しました');
  };

  const handleProcessPhoto = async () => {
    if (!photoUrl) {
      toast.error('先に写真をアップロードしてください');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/resume/photo/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          resumeId,
          options: {
            remove_background: true,
            background_color: '#ffffff',
            crop_to_id: true,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '処理に失敗しました');
      }

      setPhoto(photoUrl, data.processedUrl);
      toast.success('写真を加工しました');
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error instanceof Error ? error.message : '加工に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        証明写真
      </label>

      <div className="flex items-start gap-6">
        {/* Photo Preview */}
        <div className="relative w-[90px] h-[120px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
          {displayUrl ? (
            <>
              <Image
                src={displayUrl}
                alt="証明写真"
                fill
                className="object-cover"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="text-center p-2">
              <Camera className="h-8 w-8 mx-auto text-gray-400" />
              <span className="text-xs text-gray-500 mt-1 block">30×40mm</span>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            写真をアップロード
          </Button>

          {photoUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowIDPhotoModal(true)}
                disabled={isProcessing}
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                証明写真を作成（AI）
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleProcessPhoto}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Crop className="h-4 w-4 mr-2" />
                )}
                背景削除のみ
              </Button>
            </>
          )}

          {photoProcessedUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPhoto(photoUrl, null)}
              className="w-full text-gray-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              元の写真に戻す
            </Button>
          )}

          <p className="text-xs text-gray-500">
            JPEG、PNG形式（5MB以下）
          </p>
        </div>
      </div>

      {/* ID Photo Generator Modal */}
      {showIDPhotoModal && photoUrl && (
        <IDPhotoGenerator
          photoUrl={photoUrl}
          resumeId={resumeId || undefined}
          onComplete={(processedUrl) => {
            setPhoto(photoUrl, processedUrl);
            setShowIDPhotoModal(false);
          }}
          onClose={() => setShowIDPhotoModal(false)}
        />
      )}
    </div>
  );
}
