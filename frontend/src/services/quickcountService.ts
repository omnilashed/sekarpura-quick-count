import api, { BASE_URL } from './api';
import { QuickCountData, VoteSource } from '../types';

export const quickcountService = {
  async getQuickCount(stageId?: string, round?: number) {
    const res = await api.get<{ success: boolean; data: QuickCountData }>('/quickcount', {
      params: { stageId, round },
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

  async updateSource(
    id: string,
    payload: {
      sourceCode?: string;
      sourceName?: string;
      workUnit?: string;
      location?: string;
      targetVoters?: number;
    }
  ) {
    const res = await api.put<{ success: boolean; message: string; data: VoteSource }>(
      `/quickcount/sources/${id}`,
      payload
    );
    return res.data;
  },

  async deleteSource(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/quickcount/sources/${id}`
    );
    return res.data;
  },

  async submitVotes(payload: {
    stageId: string;
    sourceId: string;
    votes: Array<{ candidateId: string; candidateNumber: number; count: number }>;
    invalidVotes: number;
    totalVotes: number;
    round?: number;
    notes?: string;
    correctionReason?: string;
  }) {
    const res = await api.post<{
      success: boolean;
      message: string;
      quickcount: QuickCountData;
      submission?: any;
    }>(
      '/quickcount/submit-votes',
      payload
    );
    return res.data;
  },

  async liveTally(payload: {
    stageId: string;
    sourceId: string;
    candidateId?: string;
    isInvalidVote?: boolean;
    delta?: number;
    votes?: Array<{ candidateId: string; candidateNumber: number; count: number }>;
    invalidVotes?: number;
    round?: number;
  }) {
    const res = await api.post<{
      success: boolean;
      message: string;
      submission: any;
      quickcount: QuickCountData;
    }>('/quickcount/live-tally', payload);
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

  async resetSourceVotes(sourceId: string, round?: number, resetAllRounds?: boolean) {
    const res = await api.post<{
      success: boolean;
      message: string;
      source: VoteSource;
      quickcount: QuickCountData;
    }>(`/quickcount/sources/${sourceId}/reset`, { round, resetAllRounds });
    return res.data;
  },

  async resetStageVotes(stageId: string, round?: number, resetAllRounds?: boolean) {
    const res = await api.post<{
      success: boolean;
      message: string;
      quickcount: QuickCountData;
    }>(`/quickcount/stages/${stageId}/reset-votes`, { round, resetAllRounds });
    return res.data;
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
