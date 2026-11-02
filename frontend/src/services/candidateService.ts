import api from './api';
import { Candidate } from '../types';

export const candidateService = {
  async getAll(params?: {
    status?: string;
    publicationStatus?: string;
    stage?: string;
    search?: string;
  }) {
    const res = await api.get<{ success: boolean; data: Candidate[]; count: number }>(
      '/candidates',
      { params }
    );
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get<{ success: boolean; data: Candidate }>(`/candidates/${id}`);
    return res.data.data;
  },

  async create(payload: any) {
    const res = await api.post<{ success: boolean; message: string; data: Candidate }>(
      '/candidates',
      payload
    );
    return res.data;
  },

  async update(id: string, payload: Partial<Candidate>) {
    const res = await api.put<{ success: boolean; message: string; data: Candidate }>(
      `/candidates/${id}`,
      payload
    );
    return res.data;
  },

  async uploadPhoto(id: string, file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await api.post<{ success: boolean; message: string; photoUrl: string }>(
      `/candidates/${id}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  async verify(
    id: string,
    payload: {
      verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
      publicationStatus?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      rejectionReason?: string;
      candidacyStatus?: string;
    }
  ) {
    const res = await api.patch<{ success: boolean; message: string; data: Candidate }>(
      `/candidates/${id}/verify`,
      payload
    );
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/candidates/${id}`);
    return res.data;
  },
};
