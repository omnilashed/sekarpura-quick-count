import mongoose, { Schema, Document } from 'mongoose';

export type SubmissionVerificationStatus = 'DRAFT' | 'VERIFIED' | 'REJECTED';

export interface IVoteEntry {
  candidateId: mongoose.Types.ObjectId;
  candidateNumber: number;
  count: number;
}

export interface IVoteSubmission extends Document {
  electionId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;
  sourceId: mongoose.Types.ObjectId;
  votes: IVoteEntry[];
  invalidVotes: number;
  totalVotes: number;
  revision: number;
  isLatestRevision: boolean;
  verificationStatus: SubmissionVerificationStatus;
  submittedBy: mongoose.Types.ObjectId;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
  correctionReason?: string;
  attachmentKeys: string[];
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSubmissionSchema = new Schema<IVoteSubmission>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'ElectionStage', required: true, index: true },
    sourceId: { type: Schema.Types.ObjectId, ref: 'VoteSource', required: true, index: true },
    votes: [
      {
        candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
        candidateNumber: { type: Number, required: true },
        count: { type: Number, required: true, min: 0 },
      },
    ],
    invalidVotes: { type: Number, required: true, min: 0, default: 0 },
    totalVotes: { type: Number, required: true, min: 0 },
    revision: { type: Number, default: 1 },
    isLatestRevision: { type: Boolean, default: true, index: true },
    verificationStatus: {
      type: String,
      enum: ['DRAFT', 'VERIFIED', 'REJECTED'],
      default: 'VERIFIED',
      index: true,
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    notes: { type: String },
    correctionReason: { type: String },
    attachmentKeys: [{ type: String }],
    idempotencyKey: { type: String, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying latest submissions per stage and source
VoteSubmissionSchema.index({ stageId: 1, sourceId: 1, revision: -1 });

export const VoteSubmission = mongoose.model<IVoteSubmission>('VoteSubmission', VoteSubmissionSchema);
