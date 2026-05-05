import api from './api';
import { ApiResponse, User, LoginDto, RegisterDto } from '../types';

export const authService = {
  async login(dto: LoginDto) {
    const { data } = await api.post<ApiResponse<{
      user: User;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>>('/auth/login', dto);
    return data;
  },

  async register(dto: RegisterDto) {
    const { data } = await api.post<ApiResponse>('/auth/register', dto);
    return data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async getMe() {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.post<ApiResponse>('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  async updateProfile(dto: { firstName?: string; lastName?: string; contactNumber?: string; middleName?: string; address?: string; barangay?: string }) {
    const { data } = await api.put<ApiResponse<User>>('/auth/profile', dto);
    return data;
  },

  async resetPassword(token: string, newPassword: string) {
    const { data } = await api.post<ApiResponse>('/auth/reset-password', { token, newPassword });
    return data;
  },
};
