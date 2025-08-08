import axios from 'axios';
import { API_BASE_URL } from '@/utils/apiConfig';

// Create axios instance with environment variable
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        const loginPath = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/login`;
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
