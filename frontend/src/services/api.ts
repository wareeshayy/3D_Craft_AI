import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface GenerateModelResponse {
  modelId: string;
  modelUrl: string;
  status: string;
}

export const generateModel = async (prompt: string, imageFile?: File): Promise<GenerateModelResponse> => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await axios.post(`${API_BASE_URL}/generate`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

export const getModelStatus = async (modelId: string): Promise<GenerateModelResponse> => {
  const response = await axios.get(`${API_BASE_URL}/status/${modelId}`);
  return response.data;
};

export const downloadModel = async (modelId: string): Promise<Blob> => {
  const response = await axios.get(`${API_BASE_URL}/download/${modelId}`, {
    responseType: 'blob'
  });
  return response.data;
};