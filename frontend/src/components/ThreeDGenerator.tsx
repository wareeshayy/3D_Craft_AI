// src/components/ThreeDGenerator.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, Wand2, Image, Package, FileText, Loader, Download, Eye, 
  Sparkles, Settings, RefreshCw, AlertCircle, CheckCircle, Clock,
  Trash2, History, Filter, MessageCircle
} from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';
import SimpleModelViewer from './SimpleModelViewer';
import apiService from '../services/apiService';
import { 
  TextTo3DRequest, 
  ImageTo3DRequest, 
  TextureRequest, 
  GenerationResult, 
  CompleteAssetResult,
  GenerationOptions,
  JobStatus,
  ApiError,
  ValidationError,
  JobFilters,
  PaginationParams
} from '../types/api';

import { 
  generateModel, 
  getModelStatus, 
  downloadModel, 
  getPresets, 
  getPresetPrompts, 
  getStyleDetails, 
  uploadModel, 
  healthCheck, 
  APIError, 
  GenerateModelResponse, 
  ModelStatusResponse, 
  PresetsResponse, 
  PresetPromptsResponse 
} from '../services/api';

type TabType = 'text-to-3d' | 'image-to-3d' | 'texture' | 'reference' | 'complete-asset' | 'jobs';

interface ExtendedGenerationResult extends Omit<GenerationResult, 'timestamp'> {
  timestamp?: number;
  localId?: string;
}

interface ExtendedCompleteAssetResult extends Omit<CompleteAssetResult, 'timestamp'> {
  timestamp?: number;
  localId?: string;
}

type ExtendedResult = ExtendedGenerationResult | ExtendedCompleteAssetResult;

const ThreeDGenerator: React.FC = () => {
  // Main state
  const [activeTab, setActiveTab] = useState<TabType>('text-to-3d');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtendedResult | null>(null);
  const [prompt, setPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    enhancePrompt: true,
    includeReference: false,
    includeTexture: false,
    complexity: 'medium',
    style: 'realistic',
    resolution: 512
  });

  // Chatbot state
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Job management state
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobFilters, setJobFilters] = useState<JobFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Error handling state
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // History state
  const [resultHistory, setResultHistory] = useState<ExtendedResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Load jobs on component mount and tab change
  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs();
    }
  }, [activeTab, pagination, jobFilters]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  // Job management functions
  const loadJobs = async () => {
    setJobsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getJobs(pagination, jobFilters);
      setJobs(response.data.jobs);
    } catch (err) {
      handleError(err);
    } finally {
      setJobsLoading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const status = await apiService.getJobStatus(jobId);
      
      // Update job in the list
      setJobs(prev => prev.map(job => 
        job.job_id === jobId ? status : job
      ));

      // If job is completed, stop polling and get result
      if (status.status === 'completed') {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
        
        // Get the complete result
        const result = await apiService.getJobResult(jobId);
        if (result) {
          const extendedResult = {
            ...result,
            timestamp: Date.now(),
            localId: crypto.randomUUID()
          };
          setResult(extendedResult);
          addToHistory(extendedResult);
        }
        setLoading(false);
      } else if (status.status === 'failed') {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
        }
        setError(status.error_message || 'Job failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error polling job status:', err);
    }
  };

  const startJobPolling = (jobId: string) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    pollingInterval.current = setInterval(() => {
      pollJobStatus(jobId);
    }, 2000);
  };

  const cancelJob = async (jobId: string) => {
    try {
      await apiService.cancelJob(jobId);
      await loadJobs();
    } catch (err) {
      handleError(err);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      await apiService.retryJob(jobId);
      await loadJobs();
    } catch (err) {
      handleError(err);
    }
  };

  // Error handling
  const handleError = (err: any) => {
    setError(null);
    setValidationErrors({});
    
    if (err instanceof Error) {
      const errorData = (err as any).response?.data;
      
      if (errorData && 'field_errors' in errorData) {
        const validationError = errorData as ValidationError;
        setValidationErrors(validationError.field_errors);
        setError('Please check the form for validation errors');
      } else if (errorData && 'message' in errorData) {
        setError(errorData.message);
      } else {
        setError(err.message);
      }
    } else {
      setError('An unexpected error occurred');
    }
  };

  const clearError = () => {
    setError(null);
    setValidationErrors({});
  };

  // History management
  const addToHistory = (result: ExtendedResult) => {
    setResultHistory(prev => [result, ...prev].slice(0, 20)); // Keep last 20 results
  };

  const loadFromHistory = (historicalResult: ExtendedResult) => {
    setResult(historicalResult);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setResultHistory([]);
    setShowHistory(false);
  };

  // File handling with enhanced validation
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        apiService.validateImageFile(file);
        setSelectedFile(file);
        clearError();
        
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (error) {
        handleError(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [previewUrl]);

  // Enhanced generation functions with job tracking
  const handleTextTo3D = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setResult(null);
    clearError();
    
    try {
      const request: TextTo3DRequest = {
        prompt,
        enhance_prompt: options.enhancePrompt,
        parameters: {
          complexity: options.complexity,
          style: options.style,
          resolution: options.resolution
        }
      };

      const response = await apiService.generateTextTo3D(request);
      
      // Check if response.data exists and has the expected properties
      if (response && response.data) {
        // If response includes job_id, start polling
        if ('job_id' in response.data) {
          startJobPolling(response.data.job_id);
        } else {
          // Immediate result
          const extendedResult = {
  ...(response.data as object || {}),
  timestamp: Date.now(),
  localId: crypto.randomUUID()
} as ExtendedGenerationResult;
            // setError(null); // Removed error
          setResult(extendedResult);
          addToHistory(extendedResult);
          setLoading(false);
        }
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  const handleImageTo3D = async () => {
    if (!selectedFile) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setResult(null);
    clearError();
    
    try {
      const response = await apiService.uploadImageTo3D(selectedFile, description);
      
      if (response && response.data) {
        if ('job_id' in response.data) {
          startJobPolling(response.data.job_id);
        } else {
          const extendedResult = {
  ...(response.data as object || {}),
  timestamp: Date.now(),
  localId: crypto.randomUUID()
} as ExtendedGenerationResult;
          setResult(extendedResult);
          addToHistory(extendedResult);
          setLoading(false);
        }
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  const handleTextureGeneration = async () => {
    if (!description.trim()) {
      setError('Please enter a texture description');
      return;
    }

    setLoading(true);
    setResult(null);
    clearError();
    
    try {
      const request: TextureRequest = {
        description,
        size: [options.resolution || 512, options.resolution || 512]
      };

      const response = await apiService.generateTexture(request);
      
      if (response && response.data) {
        if ('job_id' in response.data) {
          startJobPolling(response.data.job_id);
        } else {
         const extendedResult = {
  ...(response.data as object || {}),
  timestamp: Date.now(),
  localId: crypto.randomUUID()
} as ExtendedGenerationResult;
          setResult(extendedResult);
          addToHistory(extendedResult);
          setLoading(false);
        }
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  const handleReferenceGeneration = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setResult(null);
    clearError();
    
    try {
      const response = await apiService.generateReferenceImage(prompt);
      
      if (response && response.data) {
        if ('job_id' in response.data) {
          startJobPolling(response.data.job_id);
        } else {
          const extendedResult = {
  ...(response.data as object || {}),
  timestamp: Date.now(),
  localId: crypto.randomUUID()
} as ExtendedGenerationResult;
          setResult(extendedResult);
          addToHistory(extendedResult);
          setLoading(false);
        }
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  const handleCompleteAsset = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setResult(null);
    clearError();
    
    try {
      const response = await apiService.generateCompleteAsset(prompt);
      
      if (response && response.data) {
        if ('job_id' in response.data) {
          startJobPolling(response.data.job_id);
        } else {
        const extendedResult = {
  ...(response.data as object || {}),
  timestamp: Date.now(),
  localId: crypto.randomUUID()
} as ExtendedCompleteAssetResult;
          setResult(extendedResult);
          addToHistory(extendedResult);
          setLoading(false);
        }
      }
    } catch (error) {
      handleError(error);
      setLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;

    const originalPrompt = prompt;
    setLoading(true);
    clearError();
    
    try {
      const response = await apiService.enhancePrompt(prompt);
      if (response.data) {
        setPrompt(response.data.enhanced_prompt);
      }
    } catch (error) {
      handleError(error);
      setPrompt(originalPrompt); // Restore original on error
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && 'status' in result) {
      apiService.downloadResult(result as GenerationResult, `3d_asset_${Date.now()}`);
    }
  };

  // Enhanced tabs with jobs tab
  const tabs = [
    { id: 'text-to-3d' as const, label: 'Text to 3D', icon: FileText },
    { id: 'image-to-3d' as const, label: 'Image to 3D', icon: Image },
    { id: 'texture' as const, label: 'Generate Texture', icon: Wand2 },
    { id: 'reference' as const, label: 'Reference Image', icon: Eye },
    { id: 'complete-asset' as const, label: 'Complete Asset', icon: Package },
    { id: 'jobs' as const, label: 'Jobs', icon: Clock }
  ];

  // Error display component
  const ErrorDisplay = ({ error, validationErrors, onClear }: {
    error: string | null;
    validationErrors: Record<string, string[]>;
    onClear: () => void;
  }) => {
    if (!error && Object.keys(validationErrors).length === 0) return null;

    return (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            {error && (
              <p className="text-red-800 font-medium mb-2">{error}</p>
            )}
            {Object.keys(validationErrors).length > 0 && (
              <div className="space-y-1">
                {Object.entries(validationErrors).map(([field, errors]) => (
                  <div key={field} className="text-sm text-red-700">
                    <span className="font-medium capitalize">{field}:</span> {errors.join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClear}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Jobs tab content
  const renderJobsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Job History</h3>
        <div className="flex gap-2">
          <button
            onClick={loadJobs}
            disabled={jobsLoading}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={jobsLoading ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={jobFilters.status?.[0] || ''}
            onChange={(e) => setJobFilters(prev => ({
              ...prev,
              status: e.target.value ? [e.target.value as any] : undefined
            }))}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={pagination.sort_by}
            onChange={(e) => setPagination(prev => ({
              ...prev,
              sort_by: e.target.value as any
            }))}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="status">Status</option>
          </select>
          
          <select
            value={pagination.sort_order}
            onChange={(e) => setPagination(prev => ({
              ...prev,
              sort_order: e.target.value as any
            }))}
            className="p-2 border border-gray-300 rounded"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {jobsLoading ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            No jobs found
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.job_id} className="p-4 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-500">
                    {job.job_id.slice(-8)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                  {job.progress !== undefined && (
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div 
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{job.progress}%</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {job.status === 'processing' && (
                    <button
                      onClick={() => cancelJob(job.job_id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Cancel Job"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button
                      onClick={() => retryJob(job.job_id)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Retry Job"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Created: {new Date(job.created_at).toLocaleString()}</div>
                <div>Updated: {new Date(job.updated_at).toLocaleString()}</div>
                {job.error_message && (
                  <div className="text-red-600 mt-2">{job.error_message}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'jobs') {
      return renderJobsTab();
    }

    switch (activeTab) {
      case 'text-to-3d':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your 3D object
              </label>
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A futuristic sports car with blue metallic paint"
                  className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    validationErrors.prompt ? 'border-red-300' : 'border-gray-300'
                  }`}
                  rows={3}
                />
                <button
                  onClick={handleEnhancePrompt}
                  disabled={loading || !prompt.trim()}
                  className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Enhance prompt with AI"
                >
                  <Sparkles size={18} />
                </button>
              </div>
              {validationErrors.prompt && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.prompt[0]}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.enhancePrompt}
                  onChange={(e) => setOptions(prev => ({ ...prev, enhancePrompt: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Auto-enhance prompt</span>
              </label>
            </div>

            <button
              onClick={handleTextTo3D}
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <FileText size={20} />}
              {loading ? 'Generating...' : 'Generate 3D Model'}
            </button>
          </div>
        );

      case 'image-to-3d':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-xs mx-auto rounded-lg shadow-md"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload size={48} className="mx-auto text-gray-400" />
                    <div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Select Image
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        JPEG, PNG, GIF, or WebP up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Convert this car to a 3D model"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleImageTo3D}
              disabled={loading || !selectedFile}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Image size={20} />}
              {loading ? 'Converting...' : 'Convert to 3D'}
            </button>
          </div>
        );

      case 'texture':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texture Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Worn leather texture with scratches and natural grain"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution
              </label>
              <select
                value={options.resolution}
                onChange={(e) => setOptions(prev => ({ ...prev, resolution: Number(e.target.value) as 256 | 512 | 1024 }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={256}>256x256 (Fast)</option>
                <option value={512}>512x512 (Standard)</option>
                <option value={1024}>1024x1024 (High Quality)</option>
              </select>
            </div>

            <button
              onClick={handleTextureGeneration}
              disabled={loading || !description.trim()}
              className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Wand2 size={20} />}
              {loading ? 'Generating...' : 'Generate Texture'}
            </button>
          </div>
        );

      case 'reference':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Object Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Medieval castle on a hilltop"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleReferenceGeneration}
              disabled={loading || !prompt.trim()}
              className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Eye size={20} />}
              {loading ? 'Generating...' : 'Generate Reference Image'}
            </button>
          </div>
        );

      case 'complete-asset':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complete Asset Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A detailed wooden dining chair with fabric cushions"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">This will generate:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 3D Model with enhanced parameters</li>
                <li>• Reference image for modeling</li>
                <li>• Matching texture/material</li>
              </ul>
            </div>

            <button
              onClick={handleCompleteAsset}
              disabled={loading || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="animate-spin" size={20} /> : <Package size={20} />}
              {loading ? 'Generating Complete Package...' : 'Generate Complete Asset'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!result) return null;

    const isCompleteAsset = 'components' in result;

    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Generation Result</h3>
          <div className="flex gap-2">
            {result.timestamp && (
              <span className="text-sm text-gray-500 px-2 py-1 bg-gray-200 rounded">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
        
        {result.status === 'success' ? (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">Success</span>
              </div>
              {!isCompleteAsset && 'method' in result && (
                <div>
                  <span className="font-medium">Method:</span> {result.method}
                </div>
              )}
              {result.job_id && (
                <div>
                  <span className="font-medium">Job ID:</span>
                  <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {result.job_id}
                  </span>
                </div>
              )}
              {result.processing_time && (
                <div>
                  <span className="font-medium">Processing Time:</span>
                  <span className="ml-2">{result.processing_time}s</span>
                </div>
              )}
            </div>

            {/* 3D Model Viewer */}
            {(result as any).model_url && (
              <div>
                <span className="font-medium mb-2 block">3D Model Preview:</span>
                <SimpleModelViewer 
                  modelUrl={(result as any).model_url}
                  className="border rounded-lg"
                />
              </div>
            )}

            {/* Enhanced Prompt Display */}
            {!isCompleteAsset && 'enhanced_prompt' in result && result.enhanced_prompt && (
              <div>
                <span className="font-medium">Enhanced Prompt:</span>
                <p className="mt-1 p-3 bg-blue-50 rounded text-sm border-l-4 border-blue-400">
                  {result.enhanced_prompt}
                </p>
              </div>
            )}

            {/* Complete Asset Results */}
            {isCompleteAsset && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Asset Components:</span>
                  <span className="text-sm text-gray-600">
                    {result.successful_components}/{result.total_components} successful
                  </span>
                </div>
                <div className="space-y-3">
                  {Object.entries(result.components).map(([component, data]) => (
                    <div key={component} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-medium">{component}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          data.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {data.status}
                        </span>
                      </div>
                      
                      {/* Show component-specific results */}
                      {data.status === 'success' && (
                        <>
                          {data.image_data && (
                            <img 
                              src={`data:image/png;base64,${data.image_data}`}
                              alt={`Generated ${component}`}
                              className="mt-2 max-w-xs rounded border"
                            />
                          )}
                          {data.texture_data && (
                            <img 
                              src={`data:image/png;base64,${data.texture_data}`}
                              alt={`Generated ${component}`}
                              className="mt-2 max-w-xs rounded border"
                            />
                          )}
                          {data.mesh_parameters && (
                            <div className="mt-2 text-xs text-gray-600">
                              <div>Type: {data.mesh_parameters.geometry_type}</div>
                              <div>Materials: {data.mesh_parameters.materials?.join(', ')}</div>
                            </div>
                          )}
                        </>
                      )}
                      
                      {data.status === 'error' && (
                        <p className="mt-2 text-sm text-red-600">{data.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mesh Parameters for single generations */}
            {!isCompleteAsset && 'mesh_parameters' in result && result.mesh_parameters && (
              <div>
                <span className="font-medium">3D Parameters:</span>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Type</div>
                    <div className="capitalize">{result.mesh_parameters.geometry_type}</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Style</div>
                    <div className="capitalize">{result.mesh_parameters.style}</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Scale</div>
                    <div className="capitalize">{result.mesh_parameters.scale}</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Complexity</div>
                    <div className="capitalize">{result.mesh_parameters.complexity}</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Materials</div>
                    <div>{result.mesh_parameters.materials?.join(', ')}</div>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="font-medium text-gray-600">Colors</div>
                    <div>{result.mesh_parameters.colors?.join(', ')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Single Image Results */}
            {!isCompleteAsset && (result.image_data || result.texture_data) && (
              <div>
                <span className="font-medium">
                  {result.image_data ? 'Generated Image:' : 'Generated Texture:'}
                </span>
                <div className="mt-2 flex justify-center">
                  <img 
                    src={`data:image/png;base64,${result.image_data || result.texture_data}`}
                    alt="Generated content"
                    className="max-w-md rounded border shadow-md"
                  />
                </div>
              </div>
            )}

            {/* Processing Info */}
            {!isCompleteAsset && result.message && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <span className="font-medium text-yellow-800">Info:</span>
                <p className="text-yellow-700 text-sm mt-1">{result.message}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <span className="font-medium text-red-800">Error:</span>
            <p className="text-red-700 text-sm mt-1">{result.message}</p>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryPanel = () => {
    if (!showHistory) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Generation History</h3>
            <div className="flex gap-2">
              <button
                onClick={clearHistory}
                className="text-red-500 hover:text-red-700 p-1"
                title="Clear History"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            {resultHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No history available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resultHistory.map((historyResult) => (
                  <div
                    key={historyResult.localId}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => loadFromHistory(historyResult)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        historyResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {historyResult.status}
                      </span>
                      {historyResult.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(historyResult.timestamp).toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {'components' in historyResult ? (
                      <div>
                        <p className="text-sm font-medium mb-1">Complete Asset</p>
                        <p className="text-xs text-gray-600">
                          {historyResult.successful_components}/{historyResult.total_components} components
                        </p>
                      </div>
                    ) : (
                      <div>
                        {'method' in historyResult && (
                          <p className="text-sm font-medium mb-1">{historyResult.method}</p>
                        )}
                        {(historyResult.image_data || historyResult.texture_data) && (
                          <img 
                            src={`data:image/png;base64,${historyResult.image_data || historyResult.texture_data}`}
                            alt="Thumbnail"
                            className="w-full h-24 object-cover rounded border"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
          <h1 className="text-3xl font-bold text-center mb-2">3D AI Generator</h1>
          <p className="text-center text-blue-100">Transform your ideas into 3D reality with AI</p>
          
          {/* Chatbot Button */}
          <button
            onClick={() => {
              console.log('Chatbot button clicked, current state:', isChatbotOpen);
              setIsChatbotOpen(!isChatbotOpen);
            }}
            className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 shadow-lg"
            title="AI Assistant"
          >
            <MessageCircle size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error}
            validationErrors={validationErrors}
            onClear={clearError}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                
                {activeTab !== 'jobs' && resultHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
                  >
                    <History size={16} />
                    History ({resultHistory.length})
                  </button>
                )}
              </div>
              
              {/* Settings Panel */}
              {(activeTab === 'text-to-3d' || activeTab === 'complete-asset') && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings size={16} />
                    <span className="font-medium text-gray-700">Generation Settings</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-600 mb-1">Style</label>
                      <select
                        value={options.style}
                        onChange={(e) => setOptions(prev => ({ ...prev, style: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="realistic">Realistic</option>
                        <option value="stylized">Stylized</option>
                        <option value="modern">Modern</option>
                        <option value="vintage">Vintage</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-600 mb-1">Complexity</label>
                      <select
                        value={options.complexity}
                        onChange={(e) => setOptions(prev => ({ ...prev, complexity: e.target.value as any }))}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low Detail</option>
                        <option value="medium">Medium Detail</option>
                        <option value="high">High Detail</option>
                        <option value="ultra">Ultra Detail</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {renderTabContent()}
            </div>

            {/* Result Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Result</h2>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Loader className="animate-spin text-blue-500 mb-4" size={48} />
                  <p className="text-gray-600">Generating your 3D content...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few minutes</p>
                  {pollingInterval.current && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Job is being processed. Status updates every 2 seconds.
                      </p>
                    </div>
                  )}
                </div>
              ) : result ? (
                renderResult()
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No results yet</p>
                  <p className="text-sm text-gray-500 mt-2">Generate content to see results here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* History Panel */}
      {renderHistoryPanel()}
      
      {/* Chatbot Widget */}
      <ChatbotWidget 
        isOpen={isChatbotOpen} 
        onClose={() => setIsChatbotOpen(false)} 
      />
    </div>
  );
};

export default ThreeDGenerator;