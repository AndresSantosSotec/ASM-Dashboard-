import axios from 'axios';
import { API_BASE_URL, API_CONFIG } from '@/utils/apiConfig';

// Create axios instance with environment configuration
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Network connectivity check
let lastConnectivityCheck = 0;
let isConnected = true;

export const checkNetworkConnectivity = async (): Promise<boolean> => {
  const now = Date.now();
  // Only check every 30 seconds to avoid spam
  if (now - lastConnectivityCheck < 30000) {
    return isConnected;
  }

  try {
    // Try a simple connectivity check
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000), // 5 second timeout for health check
    });
    isConnected = response.ok;
    lastConnectivityCheck = now;
    console.log('[API] Network connectivity check:', isConnected ? 'Connected' : 'Disconnected');
    return isConnected;
  } catch (error) {
    isConnected = false;
    lastConnectivityCheck = now;
    console.warn('[API] Network connectivity check failed:', error);
    return false;
  }
};

// Add request interceptor for auth token and logging
api.interceptors.request.use(
  config => {
    // Log API configuration for debugging
    console.log('[API] Request Config:', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
      apiConfig: API_CONFIG,
    });

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token attached to request');
      } else {
        console.log('[API] No token found in localStorage');
      }
    }
    return config;
  },
  error => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  response => {
    console.log('[API] Response received:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method,
    });
    return response;
  },
  error => {
    console.error('[API] Response error interceptor:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });

    // Check if it's a network error
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.error('[API] Network error detected. Check server connectivity.');
      
      // Try to provide helpful debugging information
      if (typeof window !== 'undefined') {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);
        console.error('[API] Device type:', isMobile ? 'Mobile' : 'Desktop');
        console.error('[API] User Agent:', window.navigator.userAgent);
        console.error('[API] Current host:', window.location.host);
        console.error('[API] API Base URL:', API_BASE_URL);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('[API] Authentication error - redirecting to login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
