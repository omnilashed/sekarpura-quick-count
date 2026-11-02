import { VoteAuditLog } from '../models/VoteAuditLog.js';
import mongoose from 'express';

export interface CreateAuditLogParams {
  electionId?: any;
  stageId?: any;
  actorId?: any;
  actorName: string;
  actorRole: string;
  ipAddress?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason: string;
}

export class AuditService {
  static async record(params: CreateAuditLogParams) {
    try {
      const log = new VoteAuditLog({
        electionId: params.electionId,
        stageId: params.stageId,
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        ipAddress: params.ipAddress,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before,
        after: params.after,
        reason: params.reason,
        timestamp: new Date(),
      });
      await log.save();
      return log;
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
      // Non-blocking in case of secondary logging error, but logged to console
      return null;
    }
  }

  static async getLogs(query: {
    electionId?: string;
    stageId?: string;
    entityType?: string;
    limit?: number;
    skip?: number;
  }) {
    const filter: any = {};
    if (query.electionId) filter.electionId = query.electionId;
    if (query.stageId) filter.stageId = query.stageId;
    if (query.entityType) filter.entityType = query.entityType;

    const limit = query.limit || 50;
    const skip = query.skip || 0;

    const [logs, total] = await Promise.all([
      VoteAuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      VoteAuditLog.countDocuments(filter),
    ]);

    return { logs, total, limit, skip };
  }
}
