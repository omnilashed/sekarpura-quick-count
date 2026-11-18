import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './env.js';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        const cleanCorsEnv = (env.CORS_ORIGIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();

        if (
          origin === env.CORS_ORIGIN ||
          cleanOrigin === cleanCorsEnv ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.netlify.app') ||
          origin.endsWith('.railway.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific election or stage
    socket.on('join_election', (electionId: string) => {
      socket.join(`election:${electionId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined election:${electionId}`);
    });

    socket.on('join_stage', (stageId: string) => {
      socket.join(`stage:${stageId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined stage:${stageId}`);
    });

    socket.on('leave_stage', (stageId: string) => {
      socket.leave(`stage:${stageId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initSocket first.');
  }
  return io;
};

export const broadcastQuickCountUpdate = (payload: {
  electionId: string;
  stageId: string;
  quickcountData: any;
  leaderChanged?: boolean;
  message?: string;
}) => {
  if (!io) return;
  // Broadcast to global, election room, and stage room
  io.emit('quickcount:updated', payload);
  io.to(`election:${payload.electionId}`).emit('quickcount:updated', payload);
  io.to(`stage:${payload.stageId}`).emit('quickcount:updated', payload);

  if (payload.leaderChanged) {
    io.emit('quickcount:ranking_changed', {
      stageId: payload.stageId,
      newLeader: payload.quickcountData.rankings?.[0],
      timestamp: new Date(),
    });
  }
};

export const broadcastStageChanged = (payload: {
  electionId: string;
  stageId: string;
  newStatus: string;
  stageType: string;
  stage: any;
}) => {
  if (!io) return;
  io.emit('election:stage_changed', payload);
  io.to(`election:${payload.electionId}`).emit('election:stage_changed', payload);
};

export const broadcastSourceVerified = (payload: {
  electionId: string;
  stageId: string;
  sourceId: string;
  sourceName: string;
  status: string;
}) => {
  if (!io) return;
  io.emit('quickcount:source_verified', payload);
};
