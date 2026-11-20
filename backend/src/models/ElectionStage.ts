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
  targetVotes: number;
  totalVotesIn: number;
  validVotes: number;
  invalidVotes: number;
  targetSourcesCount: number;
  completedSourcesCount: number;
  // Stage 2 Putaran / Rounds Management (Putaran 1 Skema 1 -> Putaran 2 Skema 2)
  activeRound: number;
  round1Completed: boolean;
  round1WinnerCandidateId?: mongoose.Types.ObjectId;
  round1Top2CandidateIds?: mongoose.Types.ObjectId[];
  round2CandidateIds?: mongoose.Types.ObjectId[];
  round2Completed: boolean;
  round2WinnerCandidateId?: mongoose.Types.ObjectId;
  // Stage 2 Tie-breaker by General Manager Bandara Halim PK (+1 suara penentu jika 50%-50%)
  isTieBreakerActive: boolean;
  tieBreakerRole: string;
  tieBreakerCandidateId?: mongoose.Types.ObjectId;
  tieBreakerVotedAt?: Date;
  tieBreakerNotes?: string;
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
    targetVotes: { type: Number, default: 24 },
    totalVotesIn: { type: Number, default: 0 },
    validVotes: { type: Number, default: 0 },
    invalidVotes: { type: Number, default: 0 },
    targetSourcesCount: { type: Number, default: 0 },
    completedSourcesCount: { type: Number, default: 0 },
    activeRound: { type: Number, default: 1, min: 1, max: 2 },
    round1Completed: { type: Boolean, default: false },
    round1WinnerCandidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    round1Top2CandidateIds: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    round2CandidateIds: [{ type: Schema.Types.ObjectId, ref: 'Candidate' }],
    round2Completed: { type: Boolean, default: false },
    round2WinnerCandidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    isTieBreakerActive: { type: Boolean, default: false },
    tieBreakerRole: {
      type: String,
      default: 'General Manager Bandara Halim Perdanakusuma',
    },
    tieBreakerCandidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    tieBreakerVotedAt: { type: Date },
    tieBreakerNotes: { type: String },
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
