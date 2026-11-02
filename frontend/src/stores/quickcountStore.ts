import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { QuickCountData } from '../types';
import { quickcountService } from '../services/quickcountService';
import { BASE_URL } from '../services/api';

interface QuickCountState {
  data: QuickCountData | null;
  isLoading: boolean;
  isLive: boolean;
  socketConnected: boolean;
  selectedStageId: string | null;
  leaderChangeAlert: { leaderName: string; candidateNumber: number } | null;
  socket: Socket | null;
  fetchQuickCount: (stageId?: string) => Promise<void>;
  setSelectedStageId: (stageId: string) => void;
  initSocket: () => void;
  disconnectSocket: () => void;
  clearLeaderAlert: () => void;
}

export const useQuickcountStore = create<QuickCountState>((set, get) => ({
  data: null,
  isLoading: true,
  isLive: false,
  socketConnected: false,
  selectedStageId: null,
  leaderChangeAlert: null,
  socket: null,

  fetchQuickCount: async (stageId?: string) => {
    try {
      set({ isLoading: true });
      const targetId = stageId || get().selectedStageId || undefined;
      const data = await quickcountService.getQuickCount(targetId);
      set({
        data,
        selectedStageId: data.stageId,
        isLive: data.stageStatus === 'COUNTING',
        isLoading: false,
      });
    } catch (err) {
      console.error('[QuickCount Store] Fetch error:', err);
      set({ isLoading: false });
    }
  },

  setSelectedStageId: (stageId: string) => {
    set({ selectedStageId: stageId });
    get().fetchQuickCount(stageId);
  },

  initSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket && existingSocket.connected) {
      return;
    }

    const socket = io(BASE_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to Election Live Stream');
      set({ socketConnected: true });

      // Join current stage room if available
      const currentStageId = get().selectedStageId;
      if (currentStageId) {
        socket.emit('join_stage', currentStageId);
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO Client] Disconnected from stream. Reconnecting...');
      set({ socketConnected: false });
    });

    // Real-time quickcount update event
    socket.on('quickcount:updated', (payload: any) => {
      console.log('[Socket.IO Client] Realtime quickcount update received:', payload);
      if (payload?.quickcountData) {
        const newData: QuickCountData = payload.quickcountData;

        // If currently viewing this stage (or viewing global)
        const currentStageId = get().selectedStageId;
        if (!currentStageId || currentStageId === newData.stageId) {
          set({
            data: newData,
            isLive: newData.stageStatus === 'COUNTING',
          });

          // Trigger elegant celebration if leader changed
          if (payload.leaderChanged && newData.top5?.[0]) {
            const newLeader = newData.top5[0];
            set({
              leaderChangeAlert: {
                leaderName: newLeader.fullName,
                candidateNumber: newLeader.candidateNumber,
              },
            });

            // Trigger non-intrusive golden confetti shower
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F5C451', '#3B82F6', '#FFFFFF'],
              });
            } catch (ignored) {}
          }
        }
      }
    });

    // Stage transition event
    socket.on('election:stage_changed', (payload: any) => {
      console.log('[Socket.IO Client] Stage transition event:', payload);
      get().fetchQuickCount(payload.stageId);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, socketConnected: false });
    }
  },

  clearLeaderAlert: () => {
    set({ leaderChangeAlert: null });
  },
}));
