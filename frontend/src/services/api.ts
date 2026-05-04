import axios from 'axios';
import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(`${BASE_URL}/auth/refresh-token`, { refreshToken });
          if (data.data?.accessToken) {
            localStorage.setItem('accessToken', data.data.accessToken);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Do not hard-redirect — let Redux auth state and ProtectedRoute handle it
        // so public pages (e.g. landing page) are not forcibly sent to /login
      }
    }
    return Promise.reject(error);
  }
);

export default api;
