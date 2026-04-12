// src/services/apiService.ts
import { 
  TextTo3DRequest, 
  ImageTo3DRequest, 
  TextureRequest, 
  GenerationResult, 
  CompleteAssetResult,
  APIResponse,
  JobStatus,
  JobFilters,
  PaginationParams,
  JobListResponse,
  JobActionResponse
} from '../types/api';

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
      status: '/api/generation/status',
      jobs: '/api/jobs',
      jobStatus: '/api/jobs/{id}/status',
      jobResult: '/api/jobs/{id}/result',
      cancelJob: '/api/jobs/{id}/cancel',
      retryJob: '/api/jobs/{id}/retry',
      health: '/api/health',
      presets: '/api/presets',
      chat: '/api/generation/chat',
      help: '/api/generation/help'
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

    // Remove Content-Type header for FormData requests
    if (options.body instanceof FormData) {
      const headers = requestOptions.headers as Record<string, string>;
      if (headers && 'Content-Type' in headers) {
        delete headers['Content-Type'];
      }
    }

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
      body: formData
    });
  }

  // 3. Chatbot API
  async chatWithAI(request: { message: string; conversation_history?: Array<{ role: string; content: string }> }): Promise<{ response: string; model: string; timestamp: number }> {
    const response = await this.makeRequest<{ response: string; model: string; timestamp: number }>(this.endpoints.chat, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    return response.data;
  }

  async get3DHelp(topic: string): Promise<{ topic: string; content: string; timestamp: number }> {
    const response = await this.makeRequest<{ topic: string; content: string; timestamp: number }>(`${this.endpoints.help}/${topic}`, {
      method: 'GET'
    });
    return response.data;
  }

  // 4. Image-to-3D Conversion (Base64)
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

  // 9. Job Management Methods
  async getJobs(pagination: PaginationParams, filters?: JobFilters): Promise<APIResponse<JobListResponse>> {
    const queryParams = new URLSearchParams();
    
    // Add pagination params
    queryParams.append('page', pagination.page.toString());
    queryParams.append('limit', pagination.limit.toString());
    if (pagination.sort_by) queryParams.append('sort_by', pagination.sort_by);
    if (pagination.sort_order) queryParams.append('sort_order', pagination.sort_order);
    
    // Add filters
    if (filters) {
      if (filters.status) queryParams.append('status', filters.status.join(','));
      if (filters.type) queryParams.append('type', filters.type.join(','));
      if (filters.priority) queryParams.append('priority', filters.priority.join(','));
    }

    return this.makeRequest<JobListResponse>(`${this.endpoints.jobs}?${queryParams.toString()}`);
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const endpoint = this.endpoints.jobStatus.replace('{id}', jobId);
    const response = await this.makeRequest<JobStatus>(endpoint);
    return response.data;
  }

  async getJobResult(jobId: string): Promise<GenerationResult | CompleteAssetResult> {
    const endpoint = this.endpoints.jobResult.replace('{id}', jobId);
    const response = await this.makeRequest<GenerationResult | CompleteAssetResult>(endpoint);
    return response.data;
  }

  async cancelJob(jobId: string): Promise<JobActionResponse> {
    const endpoint = this.endpoints.cancelJob.replace('{id}', jobId);
    const response = await this.makeRequest<JobActionResponse>(endpoint, {
      method: 'POST'
    });
    return response.data;
  }

  async retryJob(jobId: string): Promise<JobActionResponse> {
    const endpoint = this.endpoints.retryJob.replace('{id}', jobId);
    const response = await this.makeRequest<JobActionResponse>(endpoint, {
      method: 'POST'
    });
    return response.data;
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

  // Helper method to download complete asset package
  downloadCompleteAsset(result: CompleteAssetResult, filename: string = 'complete_3d_asset'): void {
    try {
      // Create a ZIP-like structure with all assets
      const assetPackage = {
        metadata: {
          prompt: (result as any).prompt,
          timestamp: new Date().toISOString(),
          asset_id: (result as any).asset_id
        },
        model: (result as any).model_data,
        texture: (result as any).texture_data,
        reference_image: (result as any).reference_image,
        enhanced_prompt: (result as any).enhanced_prompt
      };

      const downloadData = JSON.stringify(assetPackage, null, 2);
      const blob = new Blob([downloadData], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
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

  // Legacy compatibility methods
  async generateFromText(request: TextTo3DRequest): Promise<GenerationResult> {
    const response = await this.generateTextTo3D(request);
    return response.data;
  }

  async generateFromImage(request: { file: File; description?: string }): Promise<GenerationResult> {
    if (!request.file) {
      throw new Error('Image file is required');
    }
    const response = await this.uploadImageTo3D(request.file, request.description);
    return response.data;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseURL}${this.endpoints.health}`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }

  async getPresets(): Promise<any[]> {
    const response = await fetch(`${this.baseURL}${this.endpoints.presets}`);
    
    if (!response.ok) {
      throw new Error('Failed to get presets');
    }

    return response.json();
  }

  // Error handling utilities
  isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') || 
           error.message.includes('Network') || 
           error.message.includes('Failed to fetch');
  }

  isServerError(error: Error): boolean {
    return error.message.includes('HTTP 5') || 
           error.message.includes('Internal Server Error');
  }

  isClientError(error: Error): boolean {
    return error.message.includes('HTTP 4') || 
           error.message.includes('Bad Request') ||
           error.message.includes('Unauthorized') ||
           error.message.includes('Forbidden') ||
           error.message.includes('Not Found');
  }

  // Retry mechanism for failed requests
  async retryRequest<T>(
    requestFn: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry client errors (4xx)
        if (this.isClientError(lastError)) {
          throw lastError;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }

  // Batch operations
  async batchGenerateTextTo3D(requests: TextTo3DRequest[]): Promise<APIResponse<GenerationResult>[]> {
    const promises = requests.map(request => this.generateTextTo3D(request));
    return Promise.all(promises);
  }

  async batchUploadImages(files: File[], descriptions?: string[]): Promise<APIResponse<GenerationResult>[]> {
    const promises = files.map((file, index) => 
      this.uploadImageTo3D(file, descriptions?.[index])
    );
    return Promise.all(promises);
  }

  // Configuration methods
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  getEndpoints(): Record<string, string> {
    return { ...this.endpoints };
  }

  // Debug utilities
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  async getSystemInfo(): Promise<any> {
    try {
      const status = await this.getStatus();
      const health = await this.healthCheck();
      return {
        status: status.data,
        health,
        baseURL: this.baseURL,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get system info: ${error}`);
    }
  }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;

// Named export for testing or multiple instances
export { APIService };