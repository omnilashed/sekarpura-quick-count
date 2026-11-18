import api, { API_URL } from './api';
import { Presentation } from '../types';

export interface ChecksumVerificationResponse {
  success: boolean;
  data: {
    presentationId: string;
    fileName: string;
    fileSize: number;
    gridFsBytes: number;
    storedSha256: string;
    computedSha256: string;
    isIntegrityValid: boolean;
    version: number;
    uploadedAt: string;
  };
}

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

  async upload(
    file: File,
    candidateId?: string,
    title?: string,
    description?: string,
    onUploadProgress?: (progressEvent: any) => void
  ) {
    const formData = new FormData();
    formData.append('file', file);
    if (candidateId) formData.append('candidateId', candidateId);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const res = await api.post<{ success: boolean; message: string; data: Presentation }>(
      '/presentations/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return res.data;
  },

  getDownloadUrl(presentationId: string): string {
    return `${API_URL}/presentations/${presentationId}/download`;
  },

  getPreviewUrl(presentationId: string): string {
    return `${API_URL}/presentations/${presentationId}/preview`;
  },

  async verifyChecksum(presentationId: string): Promise<ChecksumVerificationResponse> {
    const res = await api.get<ChecksumVerificationResponse>(
      `/presentations/${presentationId}/verify`
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
