// src/hooks/use3DGenerator.ts
import { useState, useCallback, useRef } from 'react';
import apiService from '../services/apiService';
import { 
  TextTo3DRequest, 
  GenerationResult, 
  CompleteAssetResult, 
  GenerationOptions,
  TextureRequest 
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


interface Use3DGeneratorState {
  loading: boolean;
  result: GenerationResult | CompleteAssetResult | null;
  error: string | null;
  progress: string;
}

export const use3DGenerator = () => {
  const [state, setState] = useState<Use3DGeneratorState>({
    loading: false,
    result: null,
    error: null,
    progress: ''
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setLoading = (loading: boolean, progress: string = '') => {
    setState(prev => ({ ...prev, loading, progress, error: null }));
  };

  const setResult = (result: GenerationResult | CompleteAssetResult | null) => {
    setState(prev => ({ ...prev, result, loading: false, progress: '', error: null }));
  };

  const setError = (error: string) => {
    setState(prev => ({ ...prev, error, loading: false, progress: '', result: null }));
  };

  const resetState = () => {
    setState({
      loading: false,
      result: null,
      error: null,
      progress: ''
    });
  };

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setState(prev => ({ ...prev, loading: false, progress: '', error: 'Generation cancelled' }));
    }
  };

  // Text-to-3D Generation
  const generateTextTo3D = useCallback(async (
    prompt: string, 
    options: Partial<GenerationOptions> = {}
  ): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true, 'Enhancing prompt...');

    try {
      const request: TextTo3DRequest = {
        prompt,
        enhance_prompt: options.enhancePrompt ?? true,
        parameters: {
          complexity: options.complexity || 'medium',
          style: options.style || 'realistic',
          resolution: options.resolution || 512
        }
      };

      setLoading(true, 'Generating 3D model...');
      const response = await apiService.generateTextTo3D(request);
      setResult(response.data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }, []);

  // Image-to-3D Conversion
  const generateImageTo3D = useCallback(async (
    file: File, 
    description?: string
  ): Promise<void> => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true, 'Analyzing image...');

    try {
      apiService.validateImageFile(file);
      
      setLoading(true, 'Converting image to 3D...');
      const response = await apiService.uploadImageTo3D(file, description);
      setResult(response.data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }, []);

  // Texture Generation
  const generateTexture = useCallback(async (
    description: string,
    size: [number, number] = [512, 512]
  ): Promise<void> => {
    if (!description.trim()) {
      setError('Please enter a texture description');
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true, 'Generating texture...');

    try {
      const request: TextureRequest = { description, size };
      const response = await apiService.generateTexture(request);
      setResult(response.data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }, []);

  // Reference Image Generation
  const generateReferenceImage = useCallback(async (prompt: string): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true, 'Generating reference image...');

    try {
      const response = await apiService.generateReferenceImage(prompt);
      setResult(response.data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }, []);

  // Complete Asset Generation
  const generateCompleteAsset = useCallback(async (prompt: string): Promise<void> => {
    if (!prompt.trim()) {
      setError('Please enter a description');
      return;
    }

    abortControllerRef.current = new AbortController();
    setLoading(true, 'Generating complete asset package...');

    try {
      // Update progress during generation
      const progressSteps = [
        'Enhancing prompt...',
        'Generating 3D model...',
        'Creating reference image...',
        'Generating texture...',
        'Finalizing package...'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        if (abortControllerRef.current?.signal.aborted) return;
        setLoading(true, progressSteps[i]);
        
        // Add delay to show progress (remove in production if API provides real progress)
        if (i < progressSteps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const response = await apiService.generateCompleteAsset(prompt);
      setResult(response.data);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
      }
    }
  }, []);

  // Prompt Enhancement
  const enhancePrompt = useCallback(async (prompt: string): Promise<string> => {
    if (!prompt.trim()) return prompt;

    try {
      const response = await apiService.enhancePrompt(prompt);
      return response.data?.enhanced_prompt || prompt;
    } catch (error) {
      console.warn('Prompt enhancement failed:', error);
      return prompt; // Return original prompt on failure
    }
  }, []);

  // Download Results
  const downloadResult = useCallback((filename?: string) => {
    if (state.result && 'status' in state.result) {
      const defaultFilename = `3d_asset_${Date.now()}`;
      apiService.downloadResult(state.result as GenerationResult, filename || defaultFilename);
    }
  }, [state.result]);

  // Check Service Status
  const checkServiceStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiService.getStatus();
      return response.data.huggingface.status === 'healthy';
    } catch (error) {
      console.error('Service status check failed:', error);
      return false;
    }
  }, []);

  return {
    // State
    loading: state.loading,
    result: state.result,
    error: state.error,
    progress: state.progress,
    
    // Actions
    generateTextTo3D,
    generateImageTo3D,
    generateTexture,
    generateReferenceImage,
    generateCompleteAsset,
    enhancePrompt,
    downloadResult,
    checkServiceStatus,
    resetState,
    cancelGeneration
  };
};