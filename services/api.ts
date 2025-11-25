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
  response => {
    // 🐛 Log para debugging de cursos-estudiante
    if (response.config.url?.includes('cursos-estudiante')) {
      console.log('🔴 [API INTERCEPTOR] Response recibido:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
        data_keys: Object.keys(response.data),
        cursos_length: response.data.cursos?.length
      });
    }
    return response;
  },
  error => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Export default for backward compatibility
// Allows: import api from './api'
export default api;
