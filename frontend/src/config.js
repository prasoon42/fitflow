/** Backend origin — override with VITE_API_BASE_URL in frontend/.env */
export const API_BASE =
    (import.meta.env.VITE_API_BASE_URL && String(import.meta.env.VITE_API_BASE_URL).trim()) ||
    'http://127.0.0.1:8000';
