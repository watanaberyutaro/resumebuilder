// =====================================================
// Bria API Client
// Background Removal using Bria RMBG 2.0
// https://docs.bria.ai/image-editing/v2-endpoints/background-remove
// =====================================================

import type { BriaConfig, BriaRemoveBackgroundResponse, BriaError } from './types';

const DEFAULT_BASE_URL = 'https://engine.prod.bria-api.com/v2';
const DEFAULT_TIMEOUT = 60000; // 60 seconds

export class BriaClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config?: Partial<BriaConfig>) {
    this.apiKey = config?.apiKey || process.env.BRIA_API_KEY || '';
    this.baseUrl = config?.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config?.timeout || DEFAULT_TIMEOUT;

    if (!this.apiKey) {
      console.warn('BriaClient: No API key provided. Set BRIA_API_KEY environment variable.');
    }
  }

  /**
   * Poll status URL until job completes
   * Extended timeout for slower processing (up to 3 minutes)
   */
  private async pollStatus(statusUrl: string, maxAttempts = 60, delayMs = 3000): Promise<{ success: true; resultUrl: string } | { success: false; error: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(statusUrl, {
          headers: {
            'api_token': this.apiKey,
          },
        });

        if (!response.ok) {
          return { success: false, error: `Status check failed: ${response.status}` };
        }

        const data = await response.json() as any;
        console.log(`Bria status check (attempt ${attempt + 1}):`, data);

        // Check if complete (case-insensitive)
        const status = (data.status || '').toLowerCase();
        if (status === 'completed' || status === 'success') {
          // Try multiple possible result URL locations
          const resultUrl =
            data.result?.image_url ||
            data.result_url ||
            data.result?.url ||
            data.result ||
            data.url ||
            data.output_url ||
            data.image_url;

          if (resultUrl) {
            console.log('Result URL found:', resultUrl);
            return { success: true, resultUrl };
          }
          return { success: false, error: 'Job completed but no result URL' };
        }

        // Check if failed
        if (status === 'failed' || status === 'error') {
          return { success: false, error: data.error || 'Job failed' };
        }

        // Still processing, wait before next attempt
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Status check error',
        };
      }
    }

    return { success: false, error: 'Job timed out' };
  }

  /**
   * Remove background from an image using Bria RMBG 2.0
   * V2 API is asynchronous - returns request_id and status_url
   * @param imageUrl - Public URL of the image to process
   * @returns Promise with the URL of the processed image (transparent background)
   */
  async removeBackground(imageUrl: string): Promise<{ success: true; resultUrl: string } | { success: false; error: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'BRIA_API_KEY is not configured' };
    }

    try {
      // Download the image and convert to base64
      console.log('Downloading image from URL:', imageUrl);
      const imageBuffer = await this.fetchImageAsBuffer(imageUrl);
      console.log('Image downloaded, size:', imageBuffer.length, 'bytes');

      // Convert to base64
      const base64Image = imageBuffer.toString('base64');
      console.log('Image converted to base64');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/image/edit/remove_background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_token': this.apiKey,
        },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${base64Image}`,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bria API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        let errorData: Partial<BriaError> = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Response is not JSON
        }

        const errorMessage = errorData.message || errorText || `API error: ${response.status} ${response.statusText}`;
        return { success: false, error: errorMessage };
      }

      const data = await response.json() as any;
      console.log('Bria API response:', JSON.stringify(data, null, 2));

      // V2 API returns request_id and status_url for async processing
      if (data.status_url) {
        console.log('Polling status URL:', data.status_url);
        return await this.pollStatus(data.status_url);
      }

      // Fallback: check for immediate result (v1 style)
      const resultUrl = data.result_url || data.result || data.url || data.output_url;
      if (resultUrl) {
        return { success: true, resultUrl };
      }

      return { success: false, error: 'No status URL or result URL in response' };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timed out' };
        }
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  /**
   * Fetch an image from URL and return as Buffer
   * @param url - URL of the image
   * @returns Promise with image Buffer
   */
  async fetchImageAsBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Remove background and return the result as a Buffer
   * @param imageUrl - Public URL of the image to process
   * @returns Promise with the processed image as Buffer
   */
  async removeBackgroundAsBuffer(imageUrl: string): Promise<{ success: true; buffer: Buffer } | { success: false; error: string }> {
    const result = await this.removeBackground(imageUrl);

    if (!result.success) {
      return result;
    }

    try {
      const buffer = await this.fetchImageAsBuffer(result.resultUrl);
      return { success: true, buffer };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch processed image',
      };
    }
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const briaClient = new BriaClient();
