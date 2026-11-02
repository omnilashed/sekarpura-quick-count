import api, { BASE_URL } from './api';
import { QuickCountData, VoteSource } from '../types';

export const quickcountService = {
  async getQuickCount(stageId?: string) {
    const res = await api.get<{ success: boolean; data: QuickCountData }>('/quickcount', {
      params: { stageId },
    });
    return res.data.data;
  },

  async getSources(stageId: string) {
    const res = await api.get<{ success: boolean; data: VoteSource[] }>('/quickcount/sources', {
      params: { stageId },
    });
    return res.data.data;
  },

  async createSource(payload: {
    stageId: string;
    sourceCode: string;
    sourceName: string;
    workUnit: string;
    location: string;
    targetVoters?: number;
  }) {
    const res = await api.post<{ success: boolean; message: string; data: VoteSource }>(
      '/quickcount/sources',
      payload
    );
    return res.data;
  },

  async submitVotes(payload: {
    stageId: string;
    sourceId: string;
    votes: Array<{ candidateId: string; candidateNumber: number; count: number }>;
    invalidVotes: number;
    totalVotes: number;
    notes?: string;
  }) {
    const res = await api.post<{ success: boolean; message: string; quickcount: QuickCountData }>(
      '/quickcount/submit-votes',
      payload
    );
    return res.data;
  },

  async correctVotes(payload: {
    stageId: string;
    sourceId: string;
    votes: Array<{ candidateId: string; candidateNumber: number; count: number }>;
    invalidVotes: number;
    totalVotes: number;
    correctionReason: string;
    notes?: string;
  }) {
    const res = await api.post<{ success: boolean; message: string; quickcount: QuickCountData }>(
      '/quickcount/correct-votes',
      payload
    );
    return res.data;
  },

  async getHistory(sourceId: string) {
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/quickcount/sources/${sourceId}/history`
    );
    return res.data.data;
  },

  getExportUrl(stageId: string, format: 'csv' | 'xlsx' | 'pdf') {
    const token = localStorage.getItem('sekarpura_token');
    return `${BASE_URL}/api/reports/export?stageId=${stageId}&format=${format}&token=${token}`;
  },

  async downloadReport(stageId: string, format: 'csv' | 'xlsx' | 'pdf') {
    const res = await api.get('/reports/export', {
      params: { stageId, format },
      responseType: 'blob',
    });

    const extension = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-quickcount-sekarpura-${stageId}.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
