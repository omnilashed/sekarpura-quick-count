import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  appName: string;
  appTagline: string;
  organizationName: string;
  branchName: string;
  logoUrl: string;
  liveIndicator: boolean;
  allowCandidateEdit: boolean;
  publicQuickCountVisible: boolean;
  autoRefreshIntervalMs: number;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    appName: {
      type: String,
      default: 'SEKARPURA ELECTION CENTER',
    },
    appTagline: {
      type: String,
      default: 'Transparansi Demokrasi, Membangun Solidaritas Pekerja.',
    },
    organizationName: {
      type: String,
      default: 'Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA)',
    },
    branchName: {
      type: String,
      default: 'Cabang Halim Perdanakusuma',
    },
    logoUrl: {
      type: String,
      default: '/logo.svg',
    },
    liveIndicator: {
      type: Boolean,
      default: true,
    },
    allowCandidateEdit: {
      type: Boolean,
      default: true,
    },
    publicQuickCountVisible: {
      type: Boolean,
      default: true,
    },
    autoRefreshIntervalMs: {
      type: Number,
      default: 5000,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    contactEmail: {
      type: String,
      default: 'sekretariat@sekarpura-halim.org',
    },
    contactPhone: {
      type: String,
      default: '+62 21 809 1111',
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);
