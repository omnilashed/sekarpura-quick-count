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
import { SEED_CANDIDATES, SEED_VOTE_SOURCES } from './seedData.js';
import { QuickCountService } from '../services/quickcount.service.js';
import { PresentationService } from '../services/presentation.service.js';

export const runSeed = async () => {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Seed] Connected. Clearing previous data...');

  // Clear collections
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

  console.log('[Seed] Previous data wiped clean.');

  // 1. Create Default Admin
  const adminPasswordHash = await bcrypt.hash(env.ADMIN_DEFAULT_PASSWORD, 10);
  const adminUser = await User.create({
    name: 'Super Administrator SEKARPURA',
    email: env.ADMIN_DEFAULT_EMAIL.toLowerCase(),
    passwordHash: adminPasswordHash,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  console.log(`[Seed] Super Admin created: ${adminUser.email}`);

  // 2. Create System Settings
  const settings = await SystemSettings.create({
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
  console.log('[Seed] System settings initialized.');

  // 3. Create Main Election
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
    startedAt: new Date(Date.now() - 24 * 3600 * 1000), // Started yesterday
  });

  // 4. Create Stage 1 & Stage 2
  const stage1 = await ElectionStage.create({
    electionId: election._id,
    stageType: 'STAGE_1',
    name: 'Tahap 1 - Penjaringan Bakal Calon Ketua',
    description: 'Pemilihan tahap pertama untuk menjaring 5 kandidat peraih suara tertinggi menuju tahap definitif.',
    status: 'COUNTING',
    candidateIds: [],
    targetSourcesCount: 10,
    completedSourcesCount: 0,
    startedAt: new Date(Date.now() - 12 * 3600 * 1000),
  });

  const stage2 = await ElectionStage.create({
    electionId: election._id,
    stageType: 'STAGE_2',
    name: 'Tahap 2 - Pemilihan Calon Ketua Definitif',
    description: 'Pemilihan puncak calon ketua definitif yang terpilih dari 5 besar tahap penjaringan.',
    status: 'PENDING',
    candidateIds: [],
    targetSourcesCount: 10,
    completedSourcesCount: 0,
  });

  election.activeStageId = stage1._id as any;
  await election.save();

  // 5. Create Candidates and their Users
  const candidateDocs: any[] = [];
  const candidateUserPassword = await bcrypt.hash('Kandidat2026!', 10);

  // Ensure uploads directory exists
  const presUploadDir = path.join(env.UPLOAD_DIR, 'presentations');
  if (!fs.existsSync(presUploadDir)) fs.mkdirSync(presUploadDir, { recursive: true });

  for (const cData of SEED_CANDIDATES) {
    const candidate = await Candidate.create({
      candidateNumber: cData.candidateNumber,
      fullName: cData.fullName,
      nickname: cData.nickname,
      position: cData.position,
      workUnit: cData.workUnit,
      department: cData.department,
      tenure: cData.tenure,
      profilePhoto: `/uploads/photos/kandidat-${cData.candidateNumber}.jpg`,
      biography: cData.biography,
      vision: cData.vision,
      mission: cData.mission,
      programs: cData.programs,
      expectations: cData.expectations,
      campaignMessage: cData.campaignMessage,
      experience: cData.experience,
      leadershipExperience: cData.leadershipExperience,
      candidacyStatus: cData.candidateNumber <= 5 ? 'CALON_TETAP' : 'BAKAL_CALON',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'PUBLISHED',
      stage1Qualified: true,
      stage2Qualified: cData.candidateNumber <= 5, // Top 5 ready for Stage 2
    });

    const user = await User.create({
      name: cData.fullName,
      email: cData.email.toLowerCase(),
      passwordHash: candidateUserPassword,
      role: 'CANDIDATE',
      status: 'ACTIVE',
      candidateId: candidate._id,
    });

    candidate.userId = user._id as any;

    // Create presentation for candidate
    const sampleFileName = `presentasi-kandidat-${cData.candidateNumber}.pptx`;
    const sampleFilePath = path.join(presUploadDir, sampleFileName);
    // Write a dummy file so original exists
    if (!fs.existsSync(sampleFilePath)) {
      fs.writeFileSync(sampleFilePath, `SEKARPURA Presentation Deck - ${cData.fullName}`);
    }

    const presentation = await Presentation.create({
      candidateId: candidate._id,
      title: `Pemaparan Visi & Program Kerja - ${cData.fullName}`,
      description: `Rencana strategis penguatan solidaritas pekerja dan perbaikan PKB oleh ${cData.nickname}.`,
      originalFileName: sampleFileName,
      originalFileKey: `presentations/${sampleFileName}`,
      fileType: 'pptx',
      fileSize: 1024 * 1024 * 2.5, // 2.5 MB
      version: 1,
      conversionStatus: 'COMPLETED',
      publicationStatus: 'PUBLISHED',
      slideCount: 5,
      slidesData: [
        {
          slideNumber: 1,
          title: `Visi Perjuangan: ${cData.nickname}`,
          bullets: [
            cData.vision,
            'SEKARPURA Cabang Bandara Halim Perdanakusuma',
            'Solidaritas, Keadilan, Kesejahteraan',
          ],
        },
        {
          slideNumber: 2,
          title: 'Misi & Kebijakan Utama',
          bullets: cData.mission,
        },
        {
          slideNumber: 3,
          title: 'Program Kerja Unggulan 100 Hari',
          bullets: cData.programs.map((p) => `${p.title}: ${p.description.slice(0, 80)}...`),
        },
        {
          slideNumber: 4,
          title: 'Komitmen Kepada Seluruh Anggota',
          bullets: [
            cData.campaignMessage,
            'Advokasi hukum responsif tanpa membedakan status kepegawaian',
            'Transparansi penuh neraca keuangan serikat cabang',
          ],
        },
        {
          slideNumber: 5,
          title: 'Harapan Bagi Masa Depan SEKARPURA Halim',
          bullets: [
            cData.expectations,
            'Bersama Membangun Serikat yang Berdaulat & Mandiri!',
          ],
        },
      ],
    });

    candidate.presentationId = presentation._id as any;
    await candidate.save();
    candidateDocs.push(candidate);
  }

  // Assign candidates to Stage 1 and Top 5 to Stage 2
  stage1.candidateIds = candidateDocs.map((c) => c._id);
  await stage1.save();

  stage2.candidateIds = candidateDocs.slice(0, 5).map((c) => c._id);
  await stage2.save();

  console.log(`[Seed] 10 Candidates created with user logins and presentations.`);

  // 6. Create Vote Sources (10 TPS) for Stage 1
  const voteSourceDocs: any[] = [];
  for (const vsData of SEED_VOTE_SOURCES) {
    const source = await VoteSource.create({
      electionId: election._id,
      stageId: stage1._id,
      sourceCode: vsData.sourceCode,
      sourceName: vsData.sourceName,
      workUnit: vsData.workUnit,
      location: vsData.location,
      targetVoters: vsData.targetVoters,
      status: 'NOT_SUBMITTED',
    });
    voteSourceDocs.push(source);
  }

  // 7. Insert Verified Votes for 6 out of 10 TPS (simulating a lively active QuickCount)
  // Realistic votes distribution:
  // Candidate 1 (Hendra): ~28%
  // Candidate 2 (Budi): ~22%
  // Candidate 3 (Rahmat): ~18%
  // Candidate 4 (Dian): ~12%
  // Candidate 5 (Faisal): ~10%
  // Candidates 6-10: remaining ~10%
  const sampleTpsVotes = [
    {
      sourceIndex: 0, // TPS-01 (Admin)
      votes: [25, 20, 16, 12, 9, 3, 2, 4, 2, 2],
      invalid: 3,
    },
    {
      sourceIndex: 1, // TPS-02 (Terminal)
      votes: [22, 19, 17, 10, 8, 2, 1, 3, 2, 1],
      invalid: 2,
    },
    {
      sourceIndex: 2, // TPS-03 (AVSEC)
      votes: [28, 32, 15, 8, 7, 3, 4, 2, 2, 3],
      invalid: 4,
    },
    {
      sourceIndex: 3, // TPS-04 (ARFF)
      votes: [20, 15, 14, 11, 10, 2, 1, 2, 1, 2],
      invalid: 1,
    },
    {
      sourceIndex: 4, // TPS-05 (Apron AMC)
      votes: [26, 18, 16, 9, 8, 3, 2, 2, 3, 1],
      invalid: 2,
    },
    {
      sourceIndex: 5, // TPS-06 (Engineering)
      votes: [21, 16, 13, 12, 24, 2, 1, 1, 2, 2],
      invalid: 3,
    },
  ];

  for (let i = 0; i < sampleTpsVotes.length; i++) {
    const item = sampleTpsVotes[i];
    const source = voteSourceDocs[item.sourceIndex];

    const voteEntries = candidateDocs.map((c, cIdx) => ({
      candidateId: c._id,
      candidateNumber: c.candidateNumber,
      count: item.votes[cIdx] || 0,
    }));

    const validSum = voteEntries.reduce((sum, v) => sum + v.count, 0);
    const totalVotes = validSum + item.invalid;

    const submission = await VoteSubmission.create({
      electionId: election._id,
      stageId: stage1._id,
      sourceId: source._id,
      votes: voteEntries,
      invalidVotes: item.invalid,
      totalVotes,
      revision: 1,
      isLatestRevision: true,
      verificationStatus: 'VERIFIED',
      submittedBy: adminUser._id as any,
      verifiedBy: adminUser._id as any,
      verifiedAt: new Date(Date.now() - (6 - i) * 1800 * 1000), // Spaced by 30 mins
      notes: `Berita Acara Rekapitulasi Resmi dari ${source.sourceCode} telah diverifikasi oleh saksi.`,
    });

    source.status = 'VERIFIED';
    source.activeSubmissionId = submission._id as any;
    await source.save();

    // Audit log
    await VoteAuditLog.create({
      electionId: election._id,
      stageId: stage1._id,
      actorId: adminUser._id as any,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'VOTE_SUBMITTED',
      entityType: 'VoteSubmission',
      entityId: submission._id.toString(),
      after: {
        sourceCode: source.sourceCode,
        totalVotes,
        validVotes: validSum,
        invalidVotes: item.invalid,
      },
      reason: `Rekapitulasi resmi TPS masuk: ${source.sourceCode}`,
      timestamp: submission.verifiedAt,
    });
  }

  // 8. Calculate QuickCount aggregates
  const stage1Result = await QuickCountService.calculateStageQuickCount(stage1._id.toString());
  console.log(`[Seed] QuickCount calculated: ${stage1Result.totalVotesIn} votes recorded across ${stage1Result.completedSourcesCount} TPS.`);

  console.log('================================================================');
  console.log(' SEED COMPLETED SUCCESSFULLY!');
  console.log(' Default Admin:');
  console.log(`   Email   : ${env.ADMIN_DEFAULT_EMAIL}`);
  console.log(`   Password: ${env.ADMIN_DEFAULT_PASSWORD}`);
  console.log(' Candidate Logins:');
  console.log('   Email   : kandidat1@sekarpura-halim.org .. kandidat10@sekarpura-halim.org');
  console.log('   Password: Kandidat2026!');
  console.log('================================================================');

  await mongoose.disconnect();
};

// Auto run if executed directly
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeed().catch((err) => {
    console.error('[Seed] Failed:', err);
    process.exit(1);
  });
}
