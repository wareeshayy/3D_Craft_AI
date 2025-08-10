import axios from 'axios';

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