import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const createCandidateUserSchema = z.object({
  candidateNumber: z.number().int().positive('Nomor urut harus bilangan bulat positif'),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  nickname: z.string().min(2, 'Nama panggilan minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  position: z.string().min(2, 'Jabatan wajib diisi'),
  workUnit: z.string().min(2, 'Unit kerja wajib diisi'),
  department: z.string().min(2, 'Departemen wajib diisi'),
  tenure: z.string().optional(),
  vision: z.string().optional(),
  mission: z.array(z.string()).optional(),
  expectations: z.string().optional(),
  campaignMessage: z.string().optional(),
  willingnessStatement: z.enum(['BERSEDIA', 'TIDAK_BERSEDIA', 'DISKUALIFIKASI']).optional(),
});

export const updateCandidateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  nickname: z.string().min(2).optional(),
  position: z.string().min(2).optional(),
  workUnit: z.string().min(2).optional(),
  department: z.string().min(2).optional(),
  tenure: z.string().optional(),
  biography: z.string().optional(),
  vision: z.string().optional(),
  mission: z.array(z.string()).optional(),
  programs: z
    .array(
      z.object({
        title: z.string().min(1, 'Judul program wajib diisi'),
        description: z.string().min(1, 'Deskripsi program wajib diisi'),
        priority: z.number().optional(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        role: z.string(),
        organization: z.string(),
        period: z.string(),
        description: z.string().optional(),
      })
    )
    .optional(),
  leadershipExperience: z.string().optional(),
  expectations: z.string().optional(),
  campaignMessage: z.string().optional(),
  profileVideoUrl: z.string().url('URL video tidak valid').or(z.literal('')).optional(),
});

export const verifyCandidateSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  publicationStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  rejectionReason: z.string().optional(),
  willingnessStatement: z.enum(['BERSEDIA', 'TIDAK_BERSEDIA', 'DISKUALIFIKASI']).optional(),
  candidacyStatus: z.enum(['BAKAL_CALON', 'CALON_TETAP', 'DISKUALIFIKASI', 'TERPILIH']).optional(),
});

export const createVoteSourceSchema = z.object({
  sourceCode: z.string().min(2, 'Kode sumber minimal 2 karakter').toUpperCase(),
  sourceName: z.string().min(3, 'Nama sumber/TPS minimal 3 karakter'),
  workUnit: z.string().min(2, 'Unit kerja wajib diisi'),
  location: z.string().min(2, 'Lokasi wajib diisi'),
  targetVoters: z.number().int().min(0).default(0),
});

export const voteItemSchema = z.object({
  candidateId: z.string(),
  candidateNumber: z.number().int(),
  count: z.number().int().min(0, 'Jumlah suara tidak boleh negatif'),
});

export const submitVotesSchema = z.object({
  stageId: z.string(),
  sourceId: z.string(),
  votes: z.array(voteItemSchema),
  invalidVotes: z.number().int().min(0, 'Suara tidak sah tidak boleh negatif').default(0),
  totalVotes: z.number().int().min(0),
  notes: z.string().optional(),
  correctionReason: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const updateStageStatusSchema = z.object({
  status: z.enum(['PENDING', 'COUNTING', 'COMPLETED', 'LOCKED']),
  notes: z.string().optional(),
});

export const promoteCandidatesSchema = z.object({
  candidateIds: z.array(z.string()).min(1, 'Pilih minimal satu calon ketua definitif'),
  notes: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  appName: z.string().min(2).optional(),
  appTagline: z.string().min(2).optional(),
  organizationName: z.string().min(2).optional(),
  branchName: z.string().min(2).optional(),
  logoUrl: z.string().optional(),
  liveIndicator: z.boolean().optional(),
  allowCandidateEdit: z.boolean().optional(),
  publicQuickCountVisible: z.boolean().optional(),
  autoRefreshIntervalMs: z.number().min(1000).optional(),
  maintenanceMode: z.boolean().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
});
