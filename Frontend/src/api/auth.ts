import apiClient from './axios';
import type { AuthTokens } from './types';

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
}

export interface RegisterResponse {
  status: boolean;
  message: string;
  username: string;
  user_id: number;
  email: string;
  tokens: AuthTokens;
}

export interface GetUserResponse {
  user_id: number;
  username: string;
  email: string;
}

export const authApi = {
  async login(credentials: Record<string, string>): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/api/token/', credentials);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/register/', data);
    return response.data;
  },

  async getUser(): Promise<GetUserResponse> {
    const response = await apiClient.get<GetUserResponse>('/get-user/');
    return response.data;
  },
};