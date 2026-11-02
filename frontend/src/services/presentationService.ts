import api from './api';
import { Presentation } from '../types';

export const presentationService = {
  async getLibrary(stage?: string) {
    const res = await api.get<{ success: boolean; data: Presentation[]; count: number }>(
      '/presentations/library',
      { params: { stage } }
    );
    return res.data.data;
  },

  async getByCandidate(candidateId: string) {
    const res = await api.get<{ success: boolean; data: Presentation }>(
      `/presentations/candidate/${candidateId}`
    );
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: Presentation }>(`/presentations/${id}`);
    return res.data.data;
  },

  async upload(file: File, candidateId?: string, title?: string, description?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) formData.append('candidateId', candidateId);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const res = await api.post<{ success: boolean; message: string; data: Presentation }>(
      '/presentations/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  async updateStatus(id: string, publicationStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') {
    const res = await api.patch<{ success: boolean; message: string; data: Presentation }>(
      `/presentations/${id}/status`,
      { publicationStatus }
    );
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/presentations/${id}`);
    return res.data;
  },
};
