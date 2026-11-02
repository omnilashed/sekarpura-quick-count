import api from './api';
import { Election, ElectionStage } from '../types';

export const electionService = {
  async getOverview() {
    const res = await api.get<{
      success: boolean;
      data: { election: Election; stages: ElectionStage[] };
    }>('/elections');
    return res.data.data;
  },

  async getStages() {
    const res = await api.get<{ success: boolean; data: ElectionStage[] }>('/elections/stages');
    return res.data.data;
  },

  async updateElectionStatus(payload: { status: string; currentStage?: string; notes?: string }) {
    const res = await api.patch<{ success: boolean; message: string; data: Election }>(
      '/elections/status',
      payload
    );
    return res.data;
  },

  async updateStageStatus(stageId: string, payload: { status: string; notes?: string }) {
    const res = await api.patch<{ success: boolean; message: string; data: ElectionStage }>(
      `/elections/stages/${stageId}/status`,
      payload
    );
    return res.data;
  },

  async promoteToStage2(candidateIds: string[], notes?: string) {
    const res = await api.post<{ success: boolean; message: string; stage2: ElectionStage }>(
      '/elections/promote-to-stage2',
      { candidateIds, notes }
    );
    return res.data;
  },
};
