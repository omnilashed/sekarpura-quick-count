import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCandidate: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('sekarpura_user') || 'null'),
  token: localStorage.getItem('sekarpura_token'),
  isLoading: true,
  isAuthenticated: !!localStorage.getItem('sekarpura_token'),
  isAdmin:
    JSON.parse(localStorage.getItem('sekarpura_user') || 'null')?.role === 'ADMIN' ||
    JSON.parse(localStorage.getItem('sekarpura_user') || 'null')?.role === 'SUPER_ADMIN',
  isCandidate:
    JSON.parse(localStorage.getItem('sekarpura_user') || 'null')?.role === 'CANDIDATE',

  login: async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('sekarpura_token', token);
        localStorage.setItem('sekarpura_user', JSON.stringify(user));

        set({
          token,
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
          isCandidate: user.role === 'CANDIDATE',
          isLoading: false,
        });

        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login gagal.' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Email atau password tidak sesuai.',
      };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (ignored) {
      // ignore
    } finally {
      localStorage.removeItem('sekarpura_token');
      localStorage.removeItem('sekarpura_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isCandidate: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sekarpura_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        const user = res.data.user;
        localStorage.setItem('sekarpura_user', JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
          isCandidate: user.role === 'CANDIDATE',
          isLoading: false,
        });
      }
    } catch (err) {
      localStorage.removeItem('sekarpura_token');
      localStorage.removeItem('sekarpura_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isAdmin: false,
        isCandidate: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('sekarpura_user', JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
        isCandidate: user.role === 'CANDIDATE',
      });
    } else {
      localStorage.removeItem('sekarpura_user');
      set({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isCandidate: false,
      });
    }
  },
}));
