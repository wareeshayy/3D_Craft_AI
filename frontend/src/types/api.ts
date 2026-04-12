// src/types/api.ts - Unified TypeScript type definitions

// ========================================
// CORE API RESPONSE TYPES
// ========================================

export interface APIResponse<T> {
  message: string;
  data: T;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// ========================================
// REQUEST TYPES
// ========================================

export interface TextTo3DRequest {
  prompt: string;
  enhance_prompt?: boolean;
  parameters?: {
    complexity?: 'low' | 'medium' | 'high' | 'ultra';
    style?: 'realistic' | 'stylized' | 'modern' | 'vintage';
    resolution?: 256 | 512 | 1024;
    geometry_type?: string;
    scale?: string;
    lighting?: string;
    materials?: string[];
    colors?: string[];
  };
}

export interface ImageTo3DRequest {
  file?: File; // For file upload approach
  image_data?: string; // For base64 approach
  description?: string;
  parameters?: {
    complexity?: 'low' | 'medium' | 'high' | 'ultra';
    style?: 'realistic' | 'stylized' | 'modern' | 'vintage';
    resolution?: 256 | 512 | 1024;
    enhance_geometry?: boolean;
  };
}

export interface TextureRequest {
  description: string;
  size: [number, number]; // Required dimensions
  parameters?: {
    style?: 'realistic' | 'stylized' | 'modern' | 'vintage';
    complexity?: 'low' | 'medium' | 'high' | 'ultra';
    seamless?: boolean;
    material_type?: 'diffuse' | 'normal' | 'roughness' | 'metallic';
  };
}

// ========================================
// MESH AND MATERIAL TYPES
// ========================================

export interface MeshParameters {
  geometry_type: string;
  materials: string[];
  colors: string[];
  scale: string;
  complexity: string;
  style?: string;
  lighting?: string;
  texture_details?: string[];
}

export interface ImageAnalysis {
  dimensions: [number, number];
  mode: string;
  format: string;
  dominant_colors: string[];
  estimated_geometry: string;
  complexity: string;
  geometry_hints?: MeshParameters;
}

// ========================================
// GENERATION RESULT TYPES
// ========================================

// Base interface for all generation results
export interface BaseGenerationResult {
  job_id: string; // Made required - removing optional
  status: 'success' | 'error' | 'pending';
  message?: string;
  created_at?: string;
  processing_time?: number;
  timestamp: number; // Always include timestamp
}

// Enhanced generation result with all possible data
export interface GenerationResult extends BaseGenerationResult {
  method?: string;
  original_prompt?: string;
  enhanced_prompt?: string;
  mesh_parameters?: MeshParameters;
  model_data?: any; // Raw 3D model data
  image_data?: string; // base64 encoded image
  texture_data?: string; // base64 encoded texture
  description?: string;
  size?: [number, number];
  analysis?: ImageAnalysis; // For image-to-3D results
}

// Component result for individual parts of complete assets
export interface ComponentResult {
  status: 'success' | 'error';
  message?: string;
  image_data?: string;
  texture_data?: string;
  mesh_parameters?: MeshParameters;
  processing_time?: number;
}

// Complete asset package result
export interface CompleteAssetResult extends BaseGenerationResult {
  original_prompt: string;
  components: {
    model: ComponentResult;
    reference: ComponentResult;
    texture: ComponentResult;
    [key: string]: ComponentResult; // Allow additional components
  };
  successful_components: number;
  total_components: number;
  package_type: string;
}

// ========================================
// SERVICE AND STATUS TYPES
// ========================================

export interface ServiceStatus {
  huggingface: {
    status: string;
    api_accessible: boolean;
    timestamp: number;
    error?: string;
  };
  timestamp: number;
}

export interface ServiceStatusResponse {
  huggingface: {
    status: 'healthy' | 'unhealthy';
    last_check: string;
    api_accessible?: boolean;
    error?: string;
  };
  api: {
    status: 'healthy' | 'unhealthy';
    version: string;
  };
  timestamp: number;
}

export interface EnhancePromptResponse {
  enhanced_prompt: string;
  original_prompt: string;
  improvements?: string[];
  confidence_score?: number;
}

// ========================================
// GENERATION OPTIONS AND SETTINGS
// ========================================

export interface GenerationOptions {
  enhancePrompt?: boolean;
  includeReference?: boolean;
  includeTexture?: boolean;
  complexity?: 'low' | 'medium' | 'high' | 'ultra';
  style?: 'realistic' | 'stylized' | 'modern' | 'vintage';
  resolution?: 256 | 512 | 1024;
  // Advanced options
  seamlessTexture?: boolean;
  highPoly?: boolean;
  includeMaterials?: boolean;
  optimizeForWeb?: boolean;
  format?: 'gltf' | 'obj' | 'fbx' | 'usd';
}

export interface ProcessingOptions {
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  retries?: number;
  webhook_url?: string;
}

// ========================================
// UI STATE TYPES
// ========================================

export interface GenerationState {
  loading: boolean;
  result: GenerationResult | CompleteAssetResult | null;
  error: string | null;
  progress?: number;
  jobId?: string;
}

export interface FileUploadState {
  file: File | null;
  previewUrl: string | null;
  base64Data: string | null;
  analysis?: ImageAnalysis;
  isValid?: boolean;
  errorMessage?: string;
}

export interface BatchGenerationState {
  jobs: Array<{
    id: string;
    prompt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: GenerationResult;
    error?: string;
  }>;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
}

// ========================================
// COMPONENT PROPS TYPES
// ========================================

export interface TextTo3DFormProps {
  onGenerate: (request: TextTo3DRequest) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
  defaultValues?: Partial<TextTo3DRequest>;
}

export interface ImageTo3DFormProps {
  onGenerate: (file: File, description?: string) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
  acceptedFormats?: string[];
  maxFileSize?: number;
}

export interface TextureGeneratorProps {
  onGenerate: (request: TextureRequest) => Promise<void>;
  loading: boolean;
  disabled?: boolean;
  previewMode?: boolean;
}

export interface ResultDisplayProps {
  result: GenerationResult | CompleteAssetResult | null;
  onDownload?: () => void;
  onPreview?: () => void;
  onEdit?: () => void;
  showMetadata?: boolean;
  allowFullscreen?: boolean;
}

export interface ModelViewerProps {
  modelData?: any;
  imageData?: string;
  textureData?: string;
  width?: number;
  height?: number;
  controls?: boolean;
  autoRotate?: boolean;
}

// ========================================
// ERROR TYPES
// ========================================

export interface APIError {
  message: string;
  status?: number;
  details?: string;
  code?: string;
  timestamp?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
  code?: string;
  timestamp?: number;
  type?: 'validation' | 'network' | 'server' | 'timeout' | 'unknown';
  retry_after?: number;
  request_id?: string;
}

export interface ValidationError {
  field_errors: Record<string, string[]>; // Fixed: added field_errors property
  message?: string;
  field?: string;
  value?: any;
  code?: string;
  constraint?: string;
}

export interface ProcessingError extends APIError {
  job_id?: string;
  retry_count?: number;
  max_retries?: number;
  next_retry_at?: string;
}

// ========================================
// PRESET AND TEMPLATE TYPES
// ========================================

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  parameters: Partial<GenerationOptions>;
  preview_image?: string;
  category: 'realistic' | 'stylized' | 'modern' | 'vintage' | 'custom';
}

export interface PromptTemplate {
  id: string;
  title: string;
  template: string;
  placeholders: string[];
  category: string;
  tags: string[];
  example?: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  description: string;
  mesh_parameters: MeshParameters;
  suitable_for: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
}

// ========================================
// JOB STATUS AND MANAGEMENT TYPES
// ========================================

export interface JobStatus {
  job_id: string;
  type: GenerationType;
  status: ProcessingStatus;
  progress: number; // 0-100
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  priority: 'low' | 'normal' | 'high';
  user_id?: string;
  metadata?: Record<string, any>;
  error?: ApiError;
  result?: AnyGenerationResult;
  error_message?: string; // Added for compatibility
  resource_usage?: {
    cpu_time?: number;
    memory_usage?: number;
    gpu_time?: number;
    estimated_cost?: number;
  };
  retry_info?: {
    attempt: number;
    max_attempts: number;
    next_retry_at?: string;
    retry_reason?: string;
  };
}

export interface JobFilters {
  status?: ProcessingStatus[];
  type?: GenerationType[];
  priority?: ('low' | 'normal' | 'high')[];
  user_id?: string;
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;
  has_error?: boolean;
  complexity?: ('low' | 'medium' | 'high' | 'ultra')[];
  style?: ('realistic' | 'stylized' | 'modern' | 'vintage')[];
  search_query?: string; // Search in prompts/descriptions
  tags?: string[];
  min_processing_time?: number;
  max_processing_time?: number;
  include_metadata?: boolean;
}

// ========================================
// PAGINATION AND FILTERING
// ========================================

export interface PaginationParams {
  page: number;
  limit: number; // Changed from per_page to limit
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  cursor?: string; // For cursor-based pagination
  include_total?: boolean;
}

export interface FilterParams {
  status?: ('success' | 'error' | 'pending')[];
  method?: string[];
  date_from?: string;
  date_to?: string;
  complexity?: ('low' | 'medium' | 'high' | 'ultra')[];
  style?: ('realistic' | 'stylized' | 'modern' | 'vintage')[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
  next_cursor?: string;
  previous_cursor?: string;
}

// ========================================
// UNION TYPES AND UTILITIES
// ========================================

export type AnyGenerationResult = GenerationResult | CompleteAssetResult;

export type AnyRequest = TextTo3DRequest | ImageTo3DRequest | TextureRequest;

export type GenerationType = 'text-to-3d' | 'image-to-3d' | 'texture' | 'reference' | 'complete-asset';

export type FileFormat = 'gltf' | 'obj' | 'fbx' | 'usd' | 'ply' | 'stl';

export type QualityLevel = 'draft' | 'standard' | 'high' | 'ultra';

export type ProcessingStatus = 'queued' | 'processing' | 'post_processing' | 'completed' | 'failed' | 'cancelled';

// ========================================
// HELPER TYPES
// ========================================

export interface JobInfo {
  job_id: string;
  type: GenerationType;
  status: ProcessingStatus;
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  progress_percentage?: number;
  metadata?: Record<string, any>;
}

// Enhanced JobListResponse with comprehensive job management
export interface JobListResponse {
  jobs: JobStatus[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
    total_pages: number;
  };
  filters_applied?: JobFilters;
  summary?: {
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    pending_jobs: number;
    processing_jobs: number;
  };
}

export interface JobActionResponse {
  success: boolean;
  job_id: string;
  action: 'cancel' | 'retry' | 'prioritize' | 'delete';
  message?: string;
  updated_status?: ProcessingStatus;
}

export interface DownloadOptions {
  format?: FileFormat;
  quality?: QualityLevel;
  include_materials?: boolean;
  include_textures?: boolean;
  optimize_size?: boolean;
}

export interface PreviewOptions {
  width?: number;
  height?: number;
  background_color?: string;
  lighting?: 'studio' | 'outdoor' | 'indoor' | 'custom';
  camera_position?: 'front' | 'side' | 'top' | 'isometric' | 'custom';
}