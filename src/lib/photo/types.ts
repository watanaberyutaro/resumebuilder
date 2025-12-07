// =====================================================
// Photo Editing Service Types & Interfaces
// =====================================================

export interface PhotoProcessingOptions {
  removeBackground?: boolean;
  backgroundColor?: string; // Hex color code
  cropToIDPhoto?: boolean;
  applyBeautyFilter?: boolean;
  addSuitOverlay?: boolean;
  cropPosition?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PhotoProcessingResult {
  success: boolean;
  processedImageUrl?: string;
  processedImageBuffer?: Buffer;
  error?: string;
  processingTime?: number;
}

export interface PhotoDimensions {
  width: number;
  height: number;
}

// ID Photo standard sizes (in pixels at 300 DPI)
export const ID_PHOTO_SIZES = {
  // 縦4cm × 横3cm (標準的な履歴書用)
  RESUME_STANDARD: { width: 354, height: 472 },
  // 縦4.5cm × 横3.5cm (パスポート用)
  PASSPORT: { width: 413, height: 531 },
  // 縦3cm × 横2.4cm (運転免許証用)
  DRIVERS_LICENSE: { width: 283, height: 354 },
} as const;

export type IDPhotoSize = keyof typeof ID_PHOTO_SIZES;
