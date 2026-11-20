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

const app = createApp();

describe('SEKARPURA Election Center - API & Integrity Tests', () => {
  let adminToken = '';
  let candidate1Token = '';
  let candidate2Token = '';
  let loggedCandidate1Id = '';
  let loggedCandidate2Id = '';
  let stageCandidate1Id = '';
  let stageCandidate2Id = '';
  let stage1Id = '';
  let testSourceId = '';
  const c1Email = 'yulianto@sekarpura-halim.org';
  const c1Pass = 'Sekarpura2026!#01';
  const c2Email = 'shinta.mahadewa@sekarpura-halim.org';
  const c2Pass = 'Sekarpura2026!#02';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // 1. Admin Login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: env.ADMIN_DEFAULT_EMAIL,
        password: env.ADMIN_DEFAULT_PASSWORD,
      });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.token).toBeDefined();
    adminToken = adminRes.body.token;

    // 2. Candidate 1 & 2 Login
    const cand1Res = await request(app)
      .post('/api/auth/login')
      .send({
        email: c1Email,
        password: c1Pass,
      });

    expect(cand1Res.status).toBe(200);
    candidate1Token = cand1Res.body.token;
    loggedCandidate1Id = cand1Res.body.user.candidateId;

    const cand2Res = await request(app)
      .post('/api/auth/login')
      .send({
        email: c2Email,
        password: c2Pass,
      });

    expect(cand2Res.status).toBe(200);
    candidate2Token = cand2Res.body.token;
    loggedCandidate2Id = cand2Res.body.user.candidateId;

    // Create dedicated test stage with status COUNTING so test is isolated
    let election = await Election.findOne();
    if (!election) {
      election = await Election.create({
        title: 'Pemilihan Ketua SEKARPURA Halim Test',
        branch: 'Halim Perdanakusuma',
        currentStage: 'STAGE_1',
      });
    }

    stageCandidate1Id = loggedCandidate1Id;
    stageCandidate2Id = loggedCandidate2Id;

    const testStage = await ElectionStage.create({
      electionId: election._id,
      stageType: 'STAGE_1',
      name: 'Tahap 1 Unit Test API',
      candidateIds: [new mongoose.Types.ObjectId(stageCandidate1Id), new mongoose.Types.ObjectId(stageCandidate2Id)],
      status: 'COUNTING',
      totalEligibleVoters: 50,
      targetVotes: 50,
    });
    stage1Id = testStage._id.toString();

    // Create dedicated test source
    const source = await VoteSource.create({
      electionId: election._id,
      stageId: testStage._id,
      sourceCode: 'TPS-TEST-API',
      sourceName: 'TPS Unit Test Integrasi API',
      workUnit: 'Test Unit',
      location: 'Test Room',
      targetVoters: 50,
      status: 'NOT_SUBMITTED',
    });
    testSourceId = source._id.toString();
  });

  afterAll(async () => {
    // Clean up dedicated test TPS & Stage
    if (stage1Id) {
      await ElectionStage.findByIdAndDelete(stage1Id);
      await VoteSubmission.deleteMany({ stageId: stage1Id });
      await VoteSource.deleteMany({ stageId: stage1Id });
    }
    await VoteSource.deleteMany({ sourceCode: { $in: ['TPS-TEST', 'TPS-TEST-API', 'TPS-TEST-MISMATCH'] } });
    await mongoose.disconnect();
  });

  it('1. GET /api/health should return UP status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('2. GET /api/candidates should return list of candidates', async () => {
    const res = await request(app).get('/api/candidates');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
  });

  it('3. Bakal Calon can update their own profile', async () => {
    const res = await request(app)
      .put(`/api/candidates/${loggedCandidate1Id}`)
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({
        nickname: 'Cak Hendra Updated',
        campaignMessage: 'Pesan kampanye diperbarui oleh kandidat sendiri',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.nickname).toBe('Cak Hendra Updated');
  });

  it('4. Bakal Calon CANNOT update another candidate profile (RBAC Protection)', async () => {
    const res = await request(app)
      .put(`/api/candidates/${loggedCandidate2Id}`)
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({
        nickname: 'Hacked Nickname',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Akses ditolak/);
  });

  it('5. GET /api/quickcount should return real-time rankings and podium Top 5', async () => {
    const res = await request(app).get('/api/quickcount');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.rankings).toBeDefined();
    expect(res.body.data.top5).toBeDefined();
    expect(res.body.data.top5.length).toBeLessThanOrEqual(5);
  });

  it('6. Admin can submit votes for an unsubmitted vote source', async () => {
    const votes = [
      { candidateId: stageCandidate1Id, candidateNumber: 1, count: 15 },
      { candidateId: stageCandidate2Id, candidateNumber: 2, count: 10 },
    ];
    const invalidVotes = 2;
    const totalVotes = 27; // 15 + 10 + 2 = 27

    const res = await request(app)
      .post('/api/quickcount/submit-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: testSourceId,
        votes,
        invalidVotes,
        totalVotes,
        notes: 'Hasil rekapitulasi sah saksi unit test',
      });

    expect(res.status).toBe(201);
    expect(res.body.submission).toBeDefined();
    expect(res.body.submission.totalVotes).toBe(27);
  });

  it('7. Duplicate vote submission for the same source must be REJECTED', async () => {
    const res = await request(app)
      .post('/api/quickcount/submit-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: testSourceId,
        votes: [
          { candidateId: stageCandidate1Id, candidateNumber: 1, count: 5 },
        ],
        invalidVotes: 0,
        totalVotes: 5,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sudah pernah dimasukkan/);
  });

  it('8. Vote submission with mismatched total must be REJECTED', async () => {
    const el = await Election.findOne();
    const anotherSource = await VoteSource.create({
      electionId: el!._id,
      stageId: new mongoose.Types.ObjectId(stage1Id),
      sourceCode: 'TPS-TEST-MISMATCH',
      sourceName: 'TPS Test Mismatch',
      workUnit: 'Test Unit',
      location: 'Test Room',
      targetVoters: 50,
      status: 'NOT_SUBMITTED',
    });

    const res = await request(app)
      .post('/api/quickcount/submit-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: anotherSource._id.toString(),
        votes: [
          { candidateId: stageCandidate1Id, candidateNumber: 1, count: 10 },
        ],
        invalidVotes: 1,
        totalVotes: 999, // mismatch! 10 + 1 != 999
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Integritas total suara tidak valid/);
  });

  it('9. Admin can correct votes with mandatory reason without double counting', async () => {
    // Initial was 27 (15 + 10 + 2). Correcting to 30 (18 + 10 + 2).
    const qcBefore = await request(app).get('/api/quickcount').query({ stageId: stage1Id });
    const totalBefore = qcBefore.body.data.totalVotesIn;

    const res = await request(app)
      .post('/api/quickcount/correct-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: testSourceId,
        votes: [
          { candidateId: stageCandidate1Id, candidateNumber: 1, count: 18 },
          { candidateId: stageCandidate2Id, candidateNumber: 2, count: 10 },
        ],
        invalidVotes: 2,
        totalVotes: 30, // net increase of 3 votes
        correctionReason: 'Koreksi formulir C1 plano hasil perhitungan ulang saksi TPS',
      });

    expect(res.status).toBe(200);
    expect(res.body.submission.revision).toBe(2);

    // Verify QuickCount total increased by exactly 3, NOT 30 (no double count)
    const qcAfter = await request(app).get('/api/quickcount').query({ stageId: stage1Id });
    const totalAfter = qcAfter.body.data.totalVotesIn;
    expect(totalAfter).toBe(totalBefore + 3);
  });

  it('10. Correction without reason must be REJECTED', async () => {
    const res = await request(app)
      .post('/api/quickcount/correct-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: testSourceId,
        votes: [
          { candidateId: stageCandidate1Id, candidateNumber: 1, count: 10 },
        ],
        invalidVotes: 0,
        totalVotes: 10,
        correctionReason: '', // Empty reason
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Alasan koreksi wajib diisi/);
  });

  it('11. Security - RBAC & IDOR: Candidate 1 cannot update Candidate 2 profile', async () => {
    const res = await request(app)
      .put(`/api/candidates/${loggedCandidate2Id}`)
      .set('Authorization', `Bearer ${candidate1Token}`)
      .send({
        fullName: 'Hacked Name By Candidate 1',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Akses ditolak/);
  });

  it('12. Security: Protected endpoint rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/quickcount/submit-votes')
      .send({ stageId: stage1Id, sourceId: testSourceId });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Akses ditolak/);
  });

  it('13. Security - Rate Limiting: Login endpoint enforces strict rate limit', async () => {
    // Fire rapid login attempts to trigger rate limit (limit is 10)
    let triggered429 = false;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent_test_probe@sekarpura-halim.org',
          password: 'WrongPassword123!',
        });

      if (res.status === 429) {
        triggered429 = true;
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Terlalu banyak percobaan login/);
        break;
      }
    }
    expect(triggered429).toBe(true);
  });

  it('14. Super Admin can reset user password to default SekarpuraIndonesiaHlp2026!', async () => {
    // Buat user dummy khusus pengujian reset password
    const bcrypt = await import('bcryptjs');
    const dummyHash = await bcrypt.default.hash('InitialDummyPass123!', 10);
    const dummyUser = new User({
      name: 'Test Reset Target User',
      email: 'test_reset_target@sekarpura-halim.org',
      passwordHash: dummyHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    await dummyUser.save();

    try {
      const res = await request(app)
        .post(`/api/users/${dummyUser._id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.defaultPassword).toBe('SekarpuraIndonesiaHlp2026!');
      expect(res.body.data.mustChangePassword).toBe(true);

      // Verifikasi hash di database cocok dengan default password baru
      const updatedUser = await User.findById(dummyUser._id);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.mustChangePassword).toBe(true);
      const isPasswordValid = await bcrypt.default.compare(
        'SekarpuraIndonesiaHlp2026!',
        updatedUser!.passwordHash
      );
      expect(isPasswordValid).toBe(true);
    } finally {
      await User.findByIdAndDelete(dummyUser._id);
    }
  });

  it('15. Security - RBAC: Candidate cannot reset user password (HTTP 403)', async () => {
    const dummyUser = new User({
      name: 'Test RBAC Target User',
      email: 'test_rbac_target@sekarpura-halim.org',
      passwordHash: 'dummyhash',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    await dummyUser.save();

    try {
      const res = await request(app)
        .post(`/api/users/${dummyUser._id}/reset-password`)
        .set('Authorization', `Bearer ${candidate1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Akses ditolak/);
    } finally {
      await User.findByIdAndDelete(dummyUser._id);
    }
  });
});
