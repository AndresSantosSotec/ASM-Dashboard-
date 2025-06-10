// Sanitize the base URL to avoid duplicating the `/api` segment when the
// environment variable already includes it.
const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
export const API_BASE_URL = envUrl.replace(/\/api\/?$/, '');

