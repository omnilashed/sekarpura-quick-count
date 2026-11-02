import api from './api';
import { SystemSettings, VoteAuditLog, User } from '../types';

export const settingsService = {
  async getSettings() {
    const res = await api.get<{ success: boolean; data: SystemSettings }>('/settings');
    return res.data.data;
  },

  async updateSettings(payload: Partial<SystemSettings>) {
    const res = await api.put<{ success: boolean; message: string; data: SystemSettings }>(
      '/settings',
      payload
    );
    return res.data;
  },

  async getAuditLogs(params?: { stageId?: string; entityType?: string; limit?: number }) {
    const res = await api.get<{ success: boolean; logs: VoteAuditLog[]; total: number }>(
      '/audit',
      { params }
    );
    return res.data;
  },

  async getUsers(params?: { role?: string; status?: string; search?: string }) {
    const res = await api.get<{ success: boolean; data: User[]; count: number }>('/users', {
      params,
    });
    return res.data.data;
  },

  async createAdmin(payload: { name: string; email: string; password: string; role?: string }) {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      '/users',
      payload
    );
    return res.data;
  },

  async toggleUserStatus(id: string) {
    const res = await api.patch<{ success: boolean; message: string; data: any }>(
      `/users/${id}/toggle-status`
    );
    return res.data;
  },
};
