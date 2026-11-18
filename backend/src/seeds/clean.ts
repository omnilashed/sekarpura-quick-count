import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Candidate } from '../models/Candidate.js';
import { Election } from '../models/Election.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { Presentation } from '../models/Presentation.js';
import { VoteSource } from '../models/VoteSource.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { VoteAuditLog } from '../models/VoteAuditLog.js';
import { SystemSettings } from '../models/SystemSettings.js';

export const runClean = async () => {
  console.log('[Clean] Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Clean] Connected. Wiping dummy data...');

  // 1. Wipe all collections
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Election.deleteMany({}),
    ElectionStage.deleteMany({}),
    Presentation.deleteMany({}),
    VoteSource.deleteMany({}),
    VoteSubmission.deleteMany({}),
    VoteAuditLog.deleteMany({}),
    SystemSettings.deleteMany({}),
  ]);

  // Clean uploaded sample presentation files in uploads/ if any
  const presUploadDir = path.join(env.UPLOAD_DIR, 'presentations');
  if (fs.existsSync(presUploadDir)) {
    const files = fs.readdirSync(presUploadDir);
    for (const f of files) {
      if (f.startsWith('presentasi-kandidat-')) {
        try {
          fs.unlinkSync(path.join(presUploadDir, f));
        } catch (_) {}
      }
    }
  }

  // 2. Re-create Super Administrator
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_DEFAULT_PASSWORD, 10);
  const adminUser = await User.create({
    name: 'Super Administrator SEKARPURA',
    email: env.ADMIN_DEFAULT_EMAIL.toLowerCase(),
    passwordHash: adminPasswordHash,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  console.log(`[Clean] Super Admin account ready: ${adminUser.email}`);

  // 3. Initialize Clean System Settings
  await SystemSettings.create({
    appName: 'SEKARPURA ELECTION CENTER',
    appTagline: 'Transparansi Demokrasi, Membangun Solidaritas Pekerja.',
    organizationName: 'Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA)',
    branchName: 'Cabang Halim Perdanakusuma',
    logoUrl: '/logo.svg',
    liveIndicator: true,
    allowCandidateEdit: true,
    publicQuickCountVisible: true,
    autoRefreshIntervalMs: 5000,
    maintenanceMode: false,
    updatedBy: adminUser._id as any,
  });
  console.log('[Clean] System settings initialized.');

  // 4. Initialize Clean Election Structure
  const election = await Election.create({
    title: 'Pemilihan Ketua SEKARPURA Cabang Halim Perdanakusuma',
    description:
      'Musyawarah Anggota & Pemilihan Ketua Dewan Pengurus Cabang Serikat Pekerja Angkasa Pura Indonesia Bandara Halim Perdanakusuma Masa Bakti 2026-2029.',
    branch: 'Halim Perdanakusuma',
    electionYear: 2026,
    currentStage: 'STAGE_1',
    status: 'PRELIMINARY_COUNTING',
    rules: {
      stage1MaxCandidates: 10,
      stage2CandidatesCount: 5,
      voterQuorum: 500,
      notes: 'Berdasarkan Ketentuan AD/ART SEKARPURA dan Tata Tertib Panitia Pemilihan Cabang.',
    },
    startedAt: new Date(),
  });

  const stage1 = await ElectionStage.create({
    electionId: election._id,
    stageType: 'STAGE_1',
    name: 'Tahap 1 - Penjaringan Bakal Calon Ketua',
    description: 'Pemilihan tahap pertama untuk menjaring kandidat peraih suara tertinggi menuju tahap definitif.',
    status: 'COUNTING',
    candidateIds: [],
    targetSourcesCount: 0,
    completedSourcesCount: 0,
    totalEligibleVoters: 0,
    totalVotesIn: 0,
    validVotes: 0,
    invalidVotes: 0,
    startedAt: new Date(),
  });

  const stage2 = await ElectionStage.create({
    electionId: election._id,
    stageType: 'STAGE_2',
    name: 'Tahap 2 - Pemilihan Calon Ketua Definitif',
    description: 'Pemilihan puncak calon ketua definitif yang lolos dari tahap penjaringan.',
    status: 'PENDING',
    candidateIds: [],
    targetSourcesCount: 0,
    completedSourcesCount: 0,
    totalEligibleVoters: 0,
    totalVotesIn: 0,
    validVotes: 0,
    invalidVotes: 0,
  });

  election.activeStageId = stage1._id as any;
  await election.save();

  console.log('================================================================');
  console.log(' DATA DUMMY BERHASIL DIBERSIHKAN!');
  console.log(' Sistem siap untuk penginputan data riil.');
  console.log(' Kredensial Administrator:');
  console.log(`   Email   : ${env.ADMIN_DEFAULT_EMAIL}`);
  console.log(`   Password: ${env.ADMIN_DEFAULT_PASSWORD}`);
  console.log('================================================================');

  await mongoose.disconnect();
};

runClean().catch((err) => {
  console.error('[Clean] Error cleaning database:', err);
  process.exit(1);
});
