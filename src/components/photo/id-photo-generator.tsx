'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Shirt, X, User } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import Image from 'next/image';

type SuitType = 'male' | 'female';

interface IDPhotoGeneratorProps {
  photoUrl: string;
  resumeId?: string;
  onComplete: (processedUrl: string) => void;
  onClose: () => void;
}

export function IDPhotoGenerator({
  photoUrl,
  resumeId,
  onComplete,
  onClose,
}: IDPhotoGeneratorProps) {
  const [suitType, setSuitType] = useState<SuitType>('male');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/photo/id-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          suitType,
          resumeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '証明写真の作成に失敗しました');
      }

      setProcessedUrl(data.processedUrl);
      toast.success('証明写真を作成しました');
    } catch (err) {
      const message = err instanceof Error ? err.message : '証明写真の作成に失敗しました';
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsePhoto = () => {
    if (processedUrl) {
      onComplete(processedUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">証明写真を作成</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Photo Preview */}
          <div className="flex gap-4 justify-center">
            {/* Original Photo */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">元の写真</p>
              <div className="relative w-[88px] h-[118px] bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={photoUrl}
                  alt="元の写真"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center text-gray-400">
              <span className="text-2xl">→</span>
            </div>

            {/* Processed Photo */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">証明写真</p>
              <div className="relative w-[88px] h-[118px] bg-blue-50 rounded-lg overflow-hidden border-2 border-blue-200">
                {processedUrl ? (
                  <Image
                    src={processedUrl}
                    alt="証明写真"
                    fill
                    className="object-cover"
                  />
                ) : isProcessing ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <User className="h-10 w-10 mb-1" />
                    <span className="text-[10px]">プレビュー</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Suit Type Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">スーツタイプ</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSuitType('male')}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  suitType === 'male'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Shirt className="h-5 w-5" />
                <span className="font-medium">男性用</span>
              </button>
              <button
                type="button"
                onClick={() => setSuitType('female')}
                disabled={isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                  suitType === 'female'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <Shirt className="h-5 w-5" />
                <span className="font-medium">女性用</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              AIが背景を水色に変更し、スーツを合成して証明写真を作成します。処理には10〜30秒程度かかります。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          {processedUrl ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProcessedUrl(null);
                  setError(null);
                }}
                className="flex-1"
              >
                作り直す
              </Button>
              <Button
                type="button"
                onClick={handleUsePhoto}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                この写真を使う
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  '証明写真を作成'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
