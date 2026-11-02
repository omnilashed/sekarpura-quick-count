import mongoose, { Schema, Document } from 'mongoose';

export type VoteSourceStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface IVoteSource extends Document {
  electionId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;
  sourceCode: string;
  sourceName: string;
  workUnit: string;
  location: string;
  targetVoters: number;
  status: VoteSourceStatus;
  activeSubmissionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VoteSourceSchema = new Schema<IVoteSource>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'ElectionStage', required: true, index: true },
    sourceCode: { type: String, required: true, trim: true, uppercase: true },
    sourceName: { type: String, required: true, trim: true },
    workUnit: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    targetVoters: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    activeSubmissionId: { type: Schema.Types.ObjectId, ref: 'VoteSubmission' },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so each stage has distinct sourceCode
VoteSourceSchema.index({ stageId: 1, sourceCode: 1 }, { unique: true });

export const VoteSource = mongoose.model<IVoteSource>('VoteSource', VoteSourceSchema);
