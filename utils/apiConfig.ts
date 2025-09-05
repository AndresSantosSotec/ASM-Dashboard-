// Sanitize the base URL to avoid duplicating the `/api` segment when the
// environment variable already includes it.
const envUrl = process.env.NEXT_PUBLIC_API_URL || getDefaultApiUrl();

// Get default API URL based on environment
function getDefaultApiUrl(): string {
  // For mobile devices or when running in a mobile environment
  if (typeof window !== 'undefined') {
    const userAgent = window.navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Check if we're in a React Native environment
    const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
    
    if (isMobile || isReactNative) {
      // Use different host for mobile to avoid localhost issues
      // Try to get local network IP if available, otherwise use a default
      return 'http://192.168.1.100:8000'; // Replace with your actual server IP
    }
  }
  
  // Default for web/desktop
  return 'http://127.0.0.1:8080';
}

export const API_BASE_URL = envUrl.replace(/\/api\/?$/, '');

// Export configuration info for debugging
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  fullApiUrl: `${API_BASE_URL}/api`,
  environment: process.env.NODE_ENV,
  isBrowser: typeof window !== 'undefined',
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
};

