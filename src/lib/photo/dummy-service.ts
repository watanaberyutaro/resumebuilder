import sharp from 'sharp';
import type { IPhotoEditService } from './service-interface';
import type { PhotoProcessingOptions, PhotoProcessingResult, PhotoDimensions, IDPhotoSize } from './types';
import { ID_PHOTO_SIZES } from './types';

// =====================================================
// Dummy Photo Edit Service Implementation
// Uses sharp for basic operations
// Background removal and suit overlay are placeholder
// implementations that should be replaced with actual
// AI-powered services in production
// =====================================================

export class DummyPhotoEditService implements IPhotoEditService {
  async removeBackground(imageBuffer: Buffer): Promise<PhotoProcessingResult> {
    // Dummy implementation: Just return the original image
    // In production, this should call an API like remove.bg or use an AI model
    console.warn('DummyPhotoEditService.removeBackground: Using placeholder implementation');

    const startTime = Date.now();

    try {
      // Just pass through the image without actual background removal
      const processed = await sharp(imageBuffer)
        .png()
        .toBuffer();

      return {
        success: true,
        processedImageBuffer: processed,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async replaceBackgroundWithSolidColor(imageBuffer: Buffer, color: string): Promise<PhotoProcessingResult> {
    const startTime = Date.now();

    try {
      // Parse hex color to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const metadata = await sharp(imageBuffer).metadata();
      const { width = 400, height = 500 } = metadata;

      // Create a solid color background
      const background = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r, g, b },
        },
      })
        .jpeg()
        .toBuffer();

      // Composite the original image over the background
      // Note: This assumes the input has transparency for actual background replacement
      const processed = await sharp(background)
        .composite([{ input: imageBuffer, blend: 'over' }])
        .jpeg({ quality: 90 })
        .toBuffer();

      return {
        success: true,
        processedImageBuffer: processed,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async cropToIDPhotoSize(
    imageBuffer: Buffer,
    size: IDPhotoSize,
    manualPosition?: { x: number; y: number; width: number; height: number }
  ): Promise<PhotoProcessingResult> {
    const startTime = Date.now();

    try {
      const targetSize = ID_PHOTO_SIZES[size];
      const metadata = await sharp(imageBuffer).metadata();
      const { width: imgWidth = 400, height: imgHeight = 500 } = metadata;

      let extractOptions;

      if (manualPosition) {
        extractOptions = {
          left: Math.round(manualPosition.x),
          top: Math.round(manualPosition.y),
          width: Math.round(manualPosition.width),
          height: Math.round(manualPosition.height),
        };
      } else {
        // Auto-crop: center crop with target aspect ratio
        const targetAspect = targetSize.width / targetSize.height;
        const imgAspect = imgWidth / imgHeight;

        let cropWidth, cropHeight, cropX, cropY;

        if (imgAspect > targetAspect) {
          // Image is wider, crop sides
          cropHeight = imgHeight;
          cropWidth = Math.round(imgHeight * targetAspect);
          cropX = Math.round((imgWidth - cropWidth) / 2);
          cropY = 0;
        } else {
          // Image is taller, crop top/bottom (favor top for face)
          cropWidth = imgWidth;
          cropHeight = Math.round(imgWidth / targetAspect);
          cropX = 0;
          cropY = Math.round((imgHeight - cropHeight) / 4); // Favor upper portion
        }

        extractOptions = {
          left: cropX,
          top: cropY,
          width: cropWidth,
          height: cropHeight,
        };
      }

      const processed = await sharp(imageBuffer)
        .extract(extractOptions)
        .resize(targetSize.width, targetSize.height, {
          fit: 'cover',
          position: 'top',
        })
        .jpeg({ quality: 95 })
        .toBuffer();

      return {
        success: true,
        processedImageBuffer: processed,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async applyBeautyFilter(imageBuffer: Buffer, intensity: number = 50): Promise<PhotoProcessingResult> {
    const startTime = Date.now();

    try {
      // Simple beauty filter: slight blur + brightness/contrast adjustment
      // In production, use a proper AI beauty filter
      const blurAmount = (intensity / 100) * 0.5 + 0.3; // 0.3 to 0.8
      const brightnessMultiplier = 1 + (intensity / 100) * 0.1; // 1.0 to 1.1

      const processed = await sharp(imageBuffer)
        .modulate({
          brightness: brightnessMultiplier,
        })
        .blur(blurAmount)
        .sharpen({ sigma: 0.5 }) // Re-sharpen slightly after blur
        .jpeg({ quality: 90 })
        .toBuffer();

      return {
        success: true,
        processedImageBuffer: processed,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async addSuitOverlay(imageBuffer: Buffer, _suitType: string): Promise<PhotoProcessingResult> {
    // Dummy implementation: Just return the original image
    // In production, this should use AI-powered virtual try-on
    console.warn('DummyPhotoEditService.addSuitOverlay: Using placeholder implementation');

    const startTime = Date.now();

    try {
      const processed = await sharp(imageBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      return {
        success: true,
        processedImageBuffer: processed,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async processImage(imageBuffer: Buffer, options: PhotoProcessingOptions): Promise<PhotoProcessingResult> {
    const startTime = Date.now();
    let currentBuffer = imageBuffer;

    try {
      // Step 1: Remove background if requested
      if (options.removeBackground) {
        const result = await this.removeBackground(currentBuffer);
        if (!result.success || !result.processedImageBuffer) {
          return result;
        }
        currentBuffer = result.processedImageBuffer;
      }

      // Step 2: Replace background with solid color if requested
      if (options.backgroundColor) {
        const result = await this.replaceBackgroundWithSolidColor(currentBuffer, options.backgroundColor);
        if (!result.success || !result.processedImageBuffer) {
          return result;
        }
        currentBuffer = result.processedImageBuffer;
      }

      // Step 3: Apply beauty filter if requested
      if (options.applyBeautyFilter) {
        const result = await this.applyBeautyFilter(currentBuffer);
        if (!result.success || !result.processedImageBuffer) {
          return result;
        }
        currentBuffer = result.processedImageBuffer;
      }

      // Step 4: Add suit overlay if requested
      if (options.addSuitOverlay) {
        const result = await this.addSuitOverlay(currentBuffer, 'formal');
        if (!result.success || !result.processedImageBuffer) {
          return result;
        }
        currentBuffer = result.processedImageBuffer;
      }

      // Step 5: Crop to ID photo size if requested
      if (options.cropToIDPhoto) {
        const result = await this.cropToIDPhotoSize(currentBuffer, 'RESUME_STANDARD', options.cropPosition);
        if (!result.success || !result.processedImageBuffer) {
          return result;
        }
        currentBuffer = result.processedImageBuffer;
      }

      return {
        success: true,
        processedImageBuffer: currentBuffer,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  async getImageDimensions(imageBuffer: Buffer): Promise<PhotoDimensions> {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }
}

// Export singleton instance
export const photoEditService = new DummyPhotoEditService();
