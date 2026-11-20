import mongoose, { Schema, Document } from 'mongoose';

export type CandidacyStatus = 'BAKAL_CALON' | 'CALON_TETAP' | 'DISKUALIFIKASI' | 'TERPILIH';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface IProgram {
  title: string;
  description: string;
  priority?: number;
}

export interface IExperience {
  role: string;
  organization: string;
  period: string;
  description?: string;
}

export interface ICandidate extends Document {
  userId?: mongoose.Types.ObjectId;
  candidateNumber: number;
  fullName: string;
  nickname: string;
  position: string;
  workUnit: string;
  department: string;
  tenure?: string;
  profilePhoto?: string;
  photoGridFSId?: mongoose.Types.ObjectId;
  biography?: string;
  experience: IExperience[];
  leadershipExperience?: string;
  vision: string;
  mission: string[];
  programs: IProgram[];
  expectations?: string;
  campaignMessage?: string;
  profileVideoUrl?: string;
  presentationId?: mongoose.Types.ObjectId;
  candidacyStatus: CandidacyStatus;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  rejectionReason?: string;
  willingnessStatement?: 'BERSEDIA' | 'TIDAK_BERSEDIA' | 'DISKUALIFIKASI';
  stage1Qualified: boolean;
  stage2Qualified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    candidateNumber: { type: Number, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    workUnit: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    tenure: { type: String, trim: true },
    profilePhoto: { type: String, default: '/uploads/photos/default-avatar.png' },
    photoGridFSId: { type: Schema.Types.ObjectId },
    biography: { type: String, trim: true },
    experience: [
      {
        role: { type: String, required: true },
        organization: { type: String, required: true },
        period: { type: String, required: true },
        description: { type: String },
      },
    ],
    leadershipExperience: { type: String },
    vision: { type: String, default: '' },
    mission: [{ type: String }],
    programs: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        priority: { type: Number, default: 1 },
      },
    ],
    expectations: { type: String },
    campaignMessage: { type: String },
    profileVideoUrl: { type: String },
    presentationId: { type: Schema.Types.ObjectId, ref: 'Presentation' },
    candidacyStatus: {
      type: String,
      enum: ['BAKAL_CALON', 'CALON_TETAP', 'DISKUALIFIKASI', 'TERPILIH'],
      default: 'BAKAL_CALON',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    publicationStatus: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    rejectionReason: { type: String },
    willingnessStatement: {
      type: String,
      enum: ['BERSEDIA', 'TIDAK_BERSEDIA', 'DISKUALIFIKASI'],
      default: 'TIDAK_BERSEDIA',
      index: true,
    },
    stage1Qualified: { type: Boolean, default: true },
    stage2Qualified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
