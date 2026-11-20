import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Candidate } from '../src/models/Candidate.js';
import { ElectionStage } from '../src/models/ElectionStage.js';
import { Election } from '../src/models/Election.js';
import { VoteSource } from '../src/models/VoteSource.js';
import { VoteSubmission } from '../src/models/VoteSubmission.js';
import { QuickCountService } from '../src/services/quickcount.service.js';

const app = createApp();

describe('SEKARPURA Election Center - 2-Stage Election Schema & GM Halim Tie-Breaker Tests', () => {
  let adminToken = '';
  let electionId: mongoose.Types.ObjectId;
  let testStage2Id: string;
  let candA: any;
  let candB: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: env.ADMIN_DEFAULT_EMAIL,
        password: env.ADMIN_DEFAULT_PASSWORD,
      });

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Create or find election
    let el = await Election.findOne();
    if (!el) {
      el = await Election.create({
        title: 'Pemilihan Ketua SEKARPURA Halim Test',
        branch: 'Halim Perdanakusuma',
        currentStage: 'STAGE_2',
      });
    }
    electionId = el._id as mongoose.Types.ObjectId;

    // Create 2 test candidates for Stage 2
    candA = await Candidate.create({
      candidateNumber: 88,
      fullName: 'Calon A Definitif Test',
      nickname: 'Calon A',
      position: 'Officer',
      workUnit: 'Unit Test',
      department: 'Dept Test',
      candidacyStatus: 'CALON_TETAP',
      stage2Qualified: true,
    });

    candB = await Candidate.create({
      candidateNumber: 89,
      fullName: 'Calon B Definitif Test',
      nickname: 'Calon B',
      position: 'Specialist',
      workUnit: 'Unit Test',
      department: 'Dept Test',
      candidacyStatus: 'CALON_TETAP',
      stage2Qualified: true,
    });

    // Create Stage 2 test stage with 25 target votes
    const stg = await ElectionStage.create({
      electionId,
      stageType: 'STAGE_2',
      name: 'Tahap 2 Definitif Test',
      candidateIds: [candA._id, candB._id],
      status: 'COUNTING',
      totalEligibleVoters: 25,
      targetVotes: 25,
    });
    testStage2Id = stg._id.toString();
  });

  afterAll(async () => {
    // Cleanup test data
    if (testStage2Id) {
      await ElectionStage.findByIdAndDelete(testStage2Id);
      await VoteSubmission.deleteMany({ stageId: testStage2Id });
      await VoteSource.deleteMany({ stageId: testStage2Id });
    }
    if (candA) await Candidate.findByIdAndDelete(candA._id);
    if (candB) await Candidate.findByIdAndDelete(candB._id);
  });

  it('1. Schema 1: Calculates 50% + 1 threshold and Top 2 qualification correctly', async () => {
    // Find Stage 1
    const stage1 = await ElectionStage.findOne({ stageType: 'STAGE_1' });
    if (stage1) {
      const qcStage1 = await QuickCountService.calculateStageQuickCount(stage1._id.toString(), true);
      expect(qcStage1.schemaRules).toBeDefined();
      expect(qcStage1.schemaRules.stageType).toBe('STAGE_1');
      expect(qcStage1.schemaRules.stage1.threshold50Plus1).toBeGreaterThanOrEqual(1);
      expect(qcStage1.schemaRules.stage1.advancingCount).toBe(2);
      expect(qcStage1.schemaRules.stage1.top2CandidateIds.length).toBeLessThanOrEqual(2);
    }
  });

  it('2. Schema 2: Detects 50% - 50% tie between the two definitive candidates', async () => {
    // Create a vote source and submission with equal votes (12 vs 12)
    const source = await VoteSource.create({
      electionId,
      stageId: testStage2Id,
      sourceCode: 'TPS-TEST-TIE',
      sourceName: 'TPS Pleno Uji Seri',
      workUnit: 'Halim',
      location: 'Gedung Administrasi Halim',
      status: 'VERIFIED',
    });

    const adminUser = await User.findOne({ email: env.ADMIN_DEFAULT_EMAIL });

    await VoteSubmission.create({
      electionId,
      stageId: testStage2Id,
      sourceId: source._id,
      votes: [
        { candidateId: candA._id, candidateNumber: candA.candidateNumber, count: 12 },
        { candidateId: candB._id, candidateNumber: candB.candidateNumber, count: 12 },
      ],
      validVotes: 24,
      invalidVotes: 0,
      totalVotes: 24,
      verificationStatus: 'VERIFIED',
      isLatestRevision: true,
      revision: 1,
      submittedBy: adminUser?._id,
      verifiedBy: adminUser?._id,
    });

    const qc = await QuickCountService.calculateStageQuickCount(testStage2Id, true);
    expect(qc.totalVotesIn).toBe(24);
    expect(qc.targetVotes).toBe(25);
    expect(qc.schemaRules.stage2.is5050Tie).toBe(true);
    expect(qc.schemaRules.stage2.requiresGmTieBreaker).toBe(true);
    expect(qc.schemaRules.stage2.gmTieBreakerCast).toBe(false);
  });

  it('3. Admin/GM can cast the +1 decisive tie-breaker vote for Candidate A', async () => {
    const res = await request(app)
      .post(`/api/elections/stages/${testStage2Id}/gm-tie-breaker`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        candidateId: candA._id.toString(),
        notes: 'Keputusan resmi General Manager Bandara Halim Perdanakusuma',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Recalculate
    const qc = await QuickCountService.calculateStageQuickCount(testStage2Id, true);
    // Candidate A now has 12 + 1 = 13 votes out of 25
    expect(qc.totalVotesIn).toBe(25);
    expect(qc.targetVotes).toBe(25);
    const candARanking = qc.rankings.find((r) => r.candidateId === candA._id.toString());
    expect(candARanking?.votes).toBe(13);
    expect(qc.schemaRules.stage2.gmTieBreakerCast).toBe(true);
    expect(qc.schemaRules.stage2.definitiveWinnerId).toBe(candA._id.toString());
  });

  it('4. Admin/GM can reset the tie-breaker vote if needed', async () => {
    const res = await request(app)
      .delete(`/api/elections/stages/${testStage2Id}/gm-tie-breaker`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const qc = await QuickCountService.calculateStageQuickCount(testStage2Id, true);
    expect(qc.totalVotesIn).toBe(24);
    expect(qc.schemaRules.stage2.gmTieBreakerCast).toBe(false);
  });

  it('5. Admin can officially reset vote data for a specific TPS in production', async () => {
    // Find the vote source used in test
    const source = await VoteSource.findOne({ stageId: testStage2Id });
    expect(source).toBeDefined();

    const res = await request(app)
      .post(`/api/quickcount/sources/${source!._id}/reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resetAllRounds: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('berhasil direset kembali ke 0');

    // Verify database state: submission deleted, source status NOT_SUBMITTED
    const updatedSource = await VoteSource.findById(source!._id);
    expect(updatedSource?.status).toBe('NOT_SUBMITTED');
    expect(updatedSource?.activeSubmissionId).toBeNull();

    const remainingSubmissions = await VoteSubmission.countDocuments({ sourceId: source!._id });
    expect(remainingSubmissions).toBe(0);

    // Verify quickcount is now 0
    const qc = await QuickCountService.calculateStageQuickCount(testStage2Id, true);
    expect(qc.totalVotesIn).toBe(0);
  });

  it('6. Admin can officially reset all stage votes with clean rollback', async () => {
    const res = await request(app)
      .post(`/api/quickcount/stages/${testStage2Id}/reset-votes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resetAllRounds: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('berhasil direset kembali ke 0');

    // Verify stage state is rolled back cleanly
    const stage = await ElectionStage.findById(testStage2Id);
    expect(stage?.round1Completed).toBe(false);
    expect(stage?.round2Completed).toBe(false);
    expect(stage?.activeRound).toBe(1);
    expect(stage?.isTieBreakerActive).toBe(false);
    expect(stage?.round2CandidateIds?.length).toBe(0);

    const submissionsCount = await VoteSubmission.countDocuments({ stageId: testStage2Id });
    expect(submissionsCount).toBe(0);
  });
});
