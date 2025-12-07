import type { PhotoProcessingOptions, PhotoProcessingResult, PhotoDimensions, IDPhotoSize } from './types';

// =====================================================
// Photo Editing Service Interface
// This abstraction allows switching between different
// photo processing backends (e.g., sharp, remove.bg API,
// custom AI service, etc.)
// =====================================================

export interface IPhotoEditService {
  /**
   * Remove background from an image
   * @param imageBuffer - The input image as a Buffer
   * @returns Promise with the processed image
   */
  removeBackground(imageBuffer: Buffer): Promise<PhotoProcessingResult>;

  /**
   * Replace background with a solid color
   * @param imageBuffer - The input image (ideally with transparent background)
   * @param color - Hex color code (e.g., '#FFFFFF')
   * @returns Promise with the processed image
   */
  replaceBackgroundWithSolidColor(imageBuffer: Buffer, color: string): Promise<PhotoProcessingResult>;

  /**
   * Crop image to ID photo size with face detection
   * @param imageBuffer - The input image
   * @param size - Target ID photo size
   * @param manualPosition - Optional manual crop position
   * @returns Promise with the cropped image
   */
  cropToIDPhotoSize(
    imageBuffer: Buffer,
    size: IDPhotoSize,
    manualPosition?: { x: number; y: number; width: number; height: number }
  ): Promise<PhotoProcessingResult>;

  /**
   * Apply beauty filter (skin smoothing, brightness adjustment)
   * @param imageBuffer - The input image
   * @param intensity - Filter intensity (0-100)
   * @returns Promise with the processed image
   */
  applyBeautyFilter(imageBuffer: Buffer, intensity?: number): Promise<PhotoProcessingResult>;

  /**
   * Add suit overlay to the image
   * @param imageBuffer - The input image (portrait)
   * @param suitType - Type of suit ('formal', 'casual', 'female_formal', 'female_casual')
   * @returns Promise with the processed image
   */
  addSuitOverlay(imageBuffer: Buffer, suitType: string): Promise<PhotoProcessingResult>;

  /**
   * Process image with multiple options at once
   * @param imageBuffer - The input image
   * @param options - Processing options
   * @returns Promise with the fully processed image
   */
  processImage(imageBuffer: Buffer, options: PhotoProcessingOptions): Promise<PhotoProcessingResult>;

  /**
   * Get image dimensions
   * @param imageBuffer - The input image
   * @returns Promise with image dimensions
   */
  getImageDimensions(imageBuffer: Buffer): Promise<PhotoDimensions>;
}
