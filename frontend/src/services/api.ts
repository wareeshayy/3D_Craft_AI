import axios from 'axios';
// src/services/api.ts
import { 
  TextTo3DRequest, 
  ImageTo3DRequest, 
  TextureRequest, 
  APIResponse, 
  MeshParameters, 
  GenerationResult,
  CompleteAssetResult 
} from '../types/api';

// Fixed API base URL to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1';

// Enhanced interfaces with proper typing
interface GenerateModelResponse {
  success: boolean;
  data?: {
    modelId: string;
    modelUrl: string;
    status: string;
    jobId?: string;
    estimatedTime?: number;
  };
  message?: string;
  error?: string;
}

interface ModelStatusResponse {
  success: boolean;
  data?: {
    modelId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    modelUrl?: string;
    error?: string;
    createdAt?: string;
    completedAt?: string;
  };
  message?: string;
  error?: string;
}

interface PresetsResponse {
  success: boolean;
  data?: {
    styles: string[];
    qualities: string[];
    environments: string[];
    formats: string[];
  };
  error?: string;
}

interface PresetPromptsResponse {
  success: boolean;
  data?: {
    [category: string]: string[];
  };
  error?: string;
}

// API Error class for better error handling
class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Helper function for handling API responses
const handleApiResponse = async (response: any) => {
  if (!response.data.success) {
    throw new APIError(
      response.data.message || response.data.error || 'API request failed',
      response.status,
      response.data
    );
  }
  return response.data;
};

// Generate 3D model from text prompt and optional image
export const generateModel = async (
  prompt: string, 
  imageFile?: File,
  options?: {
    style?: string;
    quality?: string;
    environment?: string;
    format?: string;
  }
): Promise<GenerateModelResponse> => {
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    
    // Fixed typo: appendth -> append
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Add optional parameters
    if (options) {
      if (options.style) formData.append('style', options.style);
      if (options.quality) formData.append('quality', options.quality);
      if (options.environment) formData.append('environment', options.environment);
      if (options.format) formData.append('format', options.format);
    }

    const response = await axios.post(`${API_BASE_URL}/generate/text-to-3d`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 second timeout
    });

    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Get model generation status
export const getModelStatus = async (modelId: string): Promise<ModelStatusResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/${modelId}/status`);
    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Download generated 3D model
export const downloadModel = async (modelId: string): Promise<Blob> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jobs/${modelId}/download`, {
      responseType: 'blob',
      timeout: 60000 // 60 second timeout for downloads
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || 'Download failed',
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Get available presets
export const getPresets = async (): Promise<PresetsResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/presets`);
    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Get preset prompts
export const getPresetPrompts = async (): Promise<PresetPromptsResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/presets/prompts`);
    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Get style details
export const getStyleDetails = async (styleName: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/presets/styles/${styleName}`);
    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Upload 3D model file
export const uploadModel = async (file: File, metadata?: any) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // Changed from 'model_file' to avoid Pydantic warning
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await axios.post(`${API_BASE_URL}/upload/model`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minute timeout for uploads
    });

    return handleApiResponse(response);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/../health`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new APIError(
        error.response?.data?.message || error.message,
        error.response?.status,
        error.response?.data
      );
    }
    throw error;
  }
};

// Export the APIError class for use in components
export { APIError };

// Export types for use in components
export type {
  GenerateModelResponse,
  ModelStatusResponse,
  PresetsResponse,
  PresetPromptsResponse
};



class APIService {
  private baseURL: string;
  private endpoints: Record<string, string>;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.endpoints = {
      textTo3D: '/api/generation/text-to-3d',
      imageTo3D: '/api/generation/image-to-3d',
      uploadImageTo3D: '/api/generation/image-to-3d/upload',
      generateTexture: '/api/generation/generate-texture',
      generateReference: '/api/generation/generate-reference-image',
      enhancePrompt: '/api/generation/enhance-prompt',
      completeAsset: '/api/generation/generate-complete-asset',
      status: '/api/generation/status'
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // 1. Text-to-3D Generation
  async generateTextTo3D(request: TextTo3DRequest): Promise<APIResponse<GenerationResult>> {
    return this.makeRequest<GenerationResult>(this.endpoints.textTo3D, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // 2. Image-to-3D Conversion (File Upload)
  async uploadImageTo3D(file: File, description?: string): Promise<APIResponse<GenerationResult>> {
    // Validate file
    this.validateImageFile(file);

    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    return this.makeRequest<GenerationResult>(this.endpoints.uploadImageTo3D, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type for FormData
    });
  }

  // 3. Image-to-3D Conversion (Base64)
  async generateImageTo3D(request: ImageTo3DRequest): Promise<APIResponse<GenerationResult>> {
    return this.makeRequest<GenerationResult>(this.endpoints.imageTo3D, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // 4. Generate Texture
  async generateTexture(request: TextureRequest): Promise<APIResponse<GenerationResult>> {
    return this.makeRequest<GenerationResult>(this.endpoints.generateTexture, {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  // 5. Generate Reference Image
  async generateReferenceImage(prompt: string): Promise<APIResponse<GenerationResult>> {
    const encodedPrompt = encodeURIComponent(prompt);
    return this.makeRequest<GenerationResult>(`${this.endpoints.generateReference}?prompt=${encodedPrompt}`, {
      method: 'POST'
    });
  }

  // 6. Enhance Prompt
  async enhancePrompt(prompt: string, maxLength: number = 150): Promise<APIResponse<{ original_prompt: string; enhanced_prompt: string }>> {
    const encodedPrompt = encodeURIComponent(prompt);
    return this.makeRequest(`${this.endpoints.enhancePrompt}?prompt=${encodedPrompt}&max_length=${maxLength}`, {
      method: 'POST'
    });
  }

  // 7. Generate Complete 3D Asset Package
  async generateCompleteAsset(prompt: string): Promise<APIResponse<CompleteAssetResult>> {
    const encodedPrompt = encodeURIComponent(prompt);
    return this.makeRequest<CompleteAssetResult>(`${this.endpoints.completeAsset}?prompt=${encodedPrompt}`, {
      method: 'POST'
    });
  }

  // 8. Check Service Status
  async getStatus(): Promise<APIResponse<{ huggingface: any; timestamp: number }>> {
    return this.makeRequest(this.endpoints.status, {
      method: 'GET'
    });
  }

  // Utility methods
  async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  validateImageFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Please upload images smaller than 10MB.');
    }
  }

  // Helper method to download generated content
  downloadResult(result: GenerationResult, filename: string = 'generated_3d_asset'): void {
    try {
      let downloadData: string;
      let mimeType: string;
      let extension: string;

      if (result.image_data || result.texture_data) {
        // Download image/texture
        downloadData = result.image_data || result.texture_data || '';
        mimeType = 'image/png';
        extension = 'png';
      } else if (result.model_data) {
        // Download 3D model data as JSON
        downloadData = JSON.stringify(result.model_data, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else {
        // Download all result data
        downloadData = JSON.stringify(result, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      }

      const blob = result.image_data || result.texture_data 
        ? this.base64ToBlob(downloadData, mimeType)
        : new Blob([downloadData], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;