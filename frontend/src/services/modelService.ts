import { generateModel, getModelStatus, downloadModel } from './api';

export const create3DModel = async (prompt: string, imageFile?: File) => {
  try {
    const response = await generateModel(prompt, imageFile);
    return response;
  } catch (error) {
    console.error('Error generating model:', error);
    throw error;
  }
};

export const checkModelStatus = async (modelId: string) => {
  try {
    const response = await getModelStatus(modelId);
    return response;
  } catch (error) {
    console.error('Error checking model status:', error);
    throw error;
  }
};

export const download3DModel = async (modelId: string, fileName: string) => {
  try {
    const blob = await downloadModel(modelId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `3dcraft-model-${modelId}.glb`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading model:', error);
    throw error;
  }
};