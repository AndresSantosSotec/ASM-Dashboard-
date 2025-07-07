// Base URL of the Laravel API server. Set `NEXT_PUBLIC_API_URL` in your
// environment (for example in `.env.local`) to the host where the backend is
// running **without** the `/api` suffix. The axios instance in `services/api.ts`
// appends `/api` automatically.
const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

// Sanitize the base URL to avoid duplicating the `/api` segment when the
// environment variable already includes it.
export const API_BASE_URL = envUrl.replace(/\/api\/?$/, '');

