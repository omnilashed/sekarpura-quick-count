import mongoose, { Schema, Document } from 'mongoose';

export type StageType = 'STAGE_1' | 'STAGE_2';
export type StageStatus = 'PENDING' | 'COUNTING' | 'COMPLETED' | 'LOCKED';

export interface IElectionStage extends Document {
  electionId: mongoose.Types.ObjectId;
  stageType: StageType;
  name: string;
  description?: string;
  candidateIds: mongoose.Types.ObjectId[];
  status: StageStatus;
  totalEligibleVoters: number;
  totalVotesIn: number;
  validVotes: number;
  invalidVotes: number;
  targetSourcesCount: number;
  completedSourcesCount: number;
  startedAt?: Date;
  endedAt?: Date;
  finalizedAt?: Date;
  finalizedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ElectionStageSchema = new Schema<IElectionStage>(
  {
    electionId: { type: Schema.Types.ObjectId, ref: 'Election', required: true, index: true },
    stageType: {
      type: String,
      enum: ['STAGE_1', 'STAGE_2'],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    candidateIds: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    status: {
      type: String,
      enum: ['PENDING', 'COUNTING', 'COMPLETED', 'LOCKED'],
      default: 'COUNTING',
      index: true,
    },
    totalEligibleVoters: { type: Number, default: 0 },
    totalVotesIn: { type: Number, default: 0 },
    validVotes: { type: Number, default: 0 },
    invalidVotes: { type: Number, default: 0 },
    targetSourcesCount: { type: Number, default: 0 },
    completedSourcesCount: { type: Number, default: 0 },
    startedAt: { type: Date },
    endedAt: { type: Date },
    finalizedAt: { type: Date },
    finalizedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const ElectionStage = mongoose.model<IElectionStage>('ElectionStage', ElectionStageSchema);
