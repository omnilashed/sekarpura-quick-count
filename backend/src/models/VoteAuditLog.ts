import mongoose, { Schema, Document } from 'mongoose';

export interface IVoteAuditLog extends Document {
  electionId?: mongoose.Types.ObjectId;
  stageId?: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  ipAddress?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason: string;
  timestamp: Date;
  createdAt: Date;
}

const VoteAuditLogSchema = new Schema<IVoteAuditLog>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'ElectionStage', index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, required: true },
    actorRole: { type: String, required: true },
    ipAddress: { type: String },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

export const VoteAuditLog = mongoose.model<IVoteAuditLog>('VoteAuditLog', VoteAuditLogSchema);
