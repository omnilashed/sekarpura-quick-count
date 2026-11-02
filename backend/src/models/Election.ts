import mongoose, { Schema, Document } from 'mongoose';

export type ElectionOverallStatus =
  | 'DRAFT'
  | 'NOMINATION_OPEN'
  | 'NOMINATION_CLOSED'
  | 'PRELIMINARY_COUNTING'
  | 'PRELIMINARY_COMPLETED'
  | 'FINAL_CANDIDATES_ANNOUNCED'
  | 'FINAL_COUNTING'
  | 'FINAL_COMPLETED'
  | 'ARCHIVED';

export interface IElection extends Document {
  title: string;
  description: string;
  branch: string;
  electionYear: number;
  currentStage: 'STAGE_1' | 'STAGE_2';
  status: ElectionOverallStatus;
  activeStageId?: mongoose.Types.ObjectId;
  rules: {
    stage1MaxCandidates: number;
    stage2CandidatesCount: number;
    voterQuorum?: number;
    notes?: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ElectionSchema = new Schema<IElection>(
  {
    title: {
      type: String,
      required: true,
      default: 'Pemilihan Ketua SEKARPURA Cabang Halim Perdanakusuma',
    },
    description: {
      type: String,
      default: 'Pemilihan Umum Ketua Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA) Cabang Halim Perdanakusuma.',
    },
    branch: {
      type: String,
      required: true,
      default: 'Halim Perdanakusuma',
    },
    electionYear: {
      type: Number,
      required: true,
      default: 2026,
    },
    currentStage: {
      type: String,
      enum: ['STAGE_1', 'STAGE_2'],
      default: 'STAGE_1',
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'NOMINATION_OPEN',
        'NOMINATION_CLOSED',
        'PRELIMINARY_COUNTING',
        'PRELIMINARY_COMPLETED',
        'FINAL_CANDIDATES_ANNOUNCED',
        'FINAL_COUNTING',
        'FINAL_COMPLETED',
        'ARCHIVED',
      ],
      default: 'PRELIMINARY_COUNTING',
      index: true,
    },
    activeStageId: { type: Schema.Types.ObjectId, ref: 'ElectionStage' },
    rules: {
      stage1MaxCandidates: { type: Number, default: 10 },
      stage2CandidatesCount: { type: Number, default: 5 },
      voterQuorum: { type: Number, default: 0 },
      notes: { type: String, default: 'Ketentuan AD/ART SEKARPURA Halim Perdanakusuma' },
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Election = mongoose.model<IElection>('Election', ElectionSchema);
