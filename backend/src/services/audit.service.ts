import { VoteAuditLog } from '../models/VoteAuditLog.js';
import mongoose from 'mongoose';

export interface CreateAuditLogParams {
  electionId?: any;
  stageId?: any;
  actorId?: any;
  actorName?: string;
  actorRole?: string;
  ipAddress?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  before?: any;
  after?: any;
  reason?: string;
}

export class AuditService {
  static async record(params: CreateAuditLogParams) {
    try {
      const entityType = params.entityType || params.resourceType || 'SYSTEM';
      const entityId = params.entityId || params.resourceId || 'N/A';
      const reason = params.reason || params.action || 'Perekaman audit otomatis';
      const actorRole = params.actorRole || 'ADMIN';
      const actorName = params.actorName || 'System User';

      const log = new VoteAuditLog({
        electionId: params.electionId,
        stageId: params.stageId,
        actorId: params.actorId,
        actorName,
        actorRole,
        ipAddress: params.ipAddress,
        action: params.action,
        entityType,
        entityId,
        before: params.before || params.details,
        after: params.after,
        reason,
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
