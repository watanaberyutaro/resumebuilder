// =====================================================
// OpenAI Suit Generator
// Generates professional business suit overlays using DALL-E
// =====================================================

import OpenAI from 'openai';

const SUIT_PROMPTS = {
  male: `A professional men's business suit jacket and white dress shirt with tie, formal attire, centered composition, transparent background, PNG format, high quality, studio lighting, suitable for ID photo overlay, neck and shoulders visible, cropped at waist level`,
  female: `A professional women's business suit jacket and white blouse, formal attire, centered composition, transparent background, PNG format, high quality, studio lighting, suitable for ID photo overlay, neck and shoulders visible, cropped at waist level`,
};

export class SuitGenerator {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('SuitGenerator: No OpenAI API key provided. Set OPENAI_API_KEY environment variable.');
    }
  }

  /**
   * Check if the generator is properly configured
   */
  isConfigured(): boolean {
    return !!this.openai;
  }

  /**
   * Generate a suit overlay using DALL-E
   * @param suitType - Type of suit to generate (male/female)
   * @returns Promise with the generated image URL
   */
  async generateSuit(suitType: 'male' | 'female'): Promise<{ success: true; imageUrl: string } | { success: false; error: string }> {
    if (!this.openai) {
      return { success: false, error: 'OpenAI API key is not configured' };
    }

    try {
      const prompt = SUIT_PROMPTS[suitType];
      console.log('Generating suit with prompt:', prompt);

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        return { success: false, error: 'No image URL in response' };
      }

      console.log('Suit generated successfully:', imageUrl);
      return { success: true, imageUrl };
    } catch (error) {
      console.error('Suit generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suit',
      };
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
   * Generate a suit overlay and return as Buffer
   * @param suitType - Type of suit to generate (male/female)
   * @returns Promise with the generated image as Buffer
   */
  async generateSuitAsBuffer(suitType: 'male' | 'female'): Promise<{ success: true; buffer: Buffer } | { success: false; error: string }> {
    const result = await this.generateSuit(suitType);

    if (!result.success) {
      return result;
    }

    try {
      const buffer = await this.fetchImageAsBuffer(result.imageUrl);
      return { success: true, buffer };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch generated image',
      };
    }
  }
}

// Export singleton instance
export const suitGenerator = new SuitGenerator();
