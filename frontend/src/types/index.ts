export interface ModelGeneration {
  id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  modelUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}