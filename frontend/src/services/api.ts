import axios from 'axios';

// Normalisasi URL dari environment: tambahkan https:// jika tidak ada protokol & hapus trailing slash
const normalizeUrl = (raw: string | undefined, fallback: string): string => {
  let url = (raw || '').trim();
  if (!url) return fallback;
  if (!/^https?:\/\//i.test(url)) {
    const isLocal = url.startsWith('localhost') || url.startsWith('127.0.0.1');
    url = `${isLocal ? 'http' : 'https'}://${url}`;
  }
  return url.replace(/\/+$/, '');
};

export const BASE_URL = normalizeUrl(import.meta.env.VITE_SOCKET_URL, 'http://localhost:5000');

const rawApiUrl = normalizeUrl(import.meta.env.VITE_API_URL, `${BASE_URL}/api`);
export const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Authorization header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sekarpura_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Sesi kedaluwarsa
      localStorage.removeItem('sekarpura_token');
      localStorage.removeItem('sekarpura_user');
    }
    return Promise.reject(error);
  }
);

export default api;
