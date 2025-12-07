// =====================================================
// Bria API Types
// https://docs.bria.ai/
// =====================================================

export interface BriaRemoveBackgroundRequest {
  file?: string;        // URL of the image to process
  result_file_format?: 'png' | 'webp';  // Output format (default: png)
}

export interface BriaRemoveBackgroundResponse {
  result_url: string;   // URL of the processed image
}

export interface BriaEraseRequest {
  file: string;
  mask_file?: string;
  mask_type?: 'manual' | 'automatic';
}

export interface BriaEraseResponse {
  result_url: string;
}

export interface BriaError {
  error: string;
  message: string;
  status_code: number;
}

export interface BriaConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}
