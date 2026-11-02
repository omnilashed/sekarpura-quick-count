import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Candidate } from '../src/models/Candidate.js';
import { ElectionStage } from '../src/models/ElectionStage.js';
import { VoteSource } from '../src/models/VoteSource.js';
import { VoteSubmission } from '../src/models/VoteSubmission.js';

const app = createApp();

describe('SEKARPURA Election Center - API & Integrity Tests', () => {
  let adminToken = '';
  let candidate1Token = '';
  let candidate2Token = '';
  let candidate1Id = '';
  let candidate2Id = '';
  let stage1Id = '';
  let testSourceId = '';

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

    // 2. Candidate 1 Login
    const cand1Res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'kandidat1@sekarpura-halim.org',
        password: 'Kandidat2026!',
      });

    expect(cand1Res.status).toBe(200);
    candidate1Token = cand1Res.body.token;
    candidate1Id = cand1Res.body.user.candidateId;

    // 3. Candidate 2 Login
    const cand2Res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'kandidat2@sekarpura-halim.org',
        password: 'Kandidat2026!',
      });

    expect(cand2Res.status).toBe(200);
    candidate2Token = cand2Res.body.token;
    candidate2Id = cand2Res.body.user.candidateId;

    // Get Stage 1 ID
    const stage = await ElectionStage.findOne({ stageType: 'STAGE_1' });
    expect(stage).toBeDefined();
    stage1Id = stage!._id.toString();

    // Get an unsubmitted TPS or create a test one
    let source = await VoteSource.findOne({ stageId: stage1Id, status: 'NOT_SUBMITTED' });
    if (!source) {
      source = await VoteSource.create({
        electionId: stage!.electionId,
        stageId: stage!._id,
        sourceCode: 'TPS-TEST',
        sourceName: 'TPS Unit Test Integrasi',
        workUnit: 'Test Unit',
        location: 'Test Room',
        targetVoters: 50,
      });
    }
    testSourceId = source._id.toString();
  });

  afterAll(async () => {
    // Clean up test TPS if created
    await VoteSubmission.deleteMany({ sourceId: testSourceId });
    await VoteSource.deleteOne({ sourceCode: 'TPS-TEST' });
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
      .put(`/api/candidates/${candidate1Id}`)
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
      .put(`/api/candidates/${candidate2Id}`)
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
    expect(res.body.data.totalVotesIn).toBeGreaterThan(0);
    expect(res.body.data.rankings).toBeDefined();
    expect(res.body.data.top5).toBeDefined();
    expect(res.body.data.top5.length).toBeLessThanOrEqual(5);
  });

  it('6. Admin can submit votes for an unsubmitted vote source', async () => {
    const candidates = await Candidate.find({ _id: { $in: [candidate1Id, candidate2Id] } });

    const votes = [
      { candidateId: candidate1Id, candidateNumber: 1, count: 15 },
      { candidateId: candidate2Id, candidateNumber: 2, count: 10 },
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
          { candidateId: candidate1Id, candidateNumber: 1, count: 5 },
        ],
        invalidVotes: 0,
        totalVotes: 5,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/sudah pernah dimasukkan/);
  });

  it('8. Vote submission with mismatched total must be REJECTED', async () => {
    const anotherSource = await VoteSource.findOne({ status: 'NOT_SUBMITTED' });
    if (!anotherSource) return;

    const res = await request(app)
      .post('/api/quickcount/submit-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: anotherSource._id.toString(),
        votes: [
          { candidateId: candidate1Id, candidateNumber: 1, count: 10 },
        ],
        invalidVotes: 1,
        totalVotes: 999, // mismatch! 10 + 1 != 999
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Integritas total suara tidak valid/);
  });

  it('9. Admin can correct votes with mandatory reason without double counting', async () => {
    // Initial was 27 (15 + 10 + 2). Correcting to 30 (18 + 10 + 2).
    const qcBefore = await request(app).get('/api/quickcount');
    const totalBefore = qcBefore.body.data.totalVotesIn;

    const res = await request(app)
      .post('/api/quickcount/correct-votes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        stageId: stage1Id,
        sourceId: testSourceId,
        votes: [
          { candidateId: candidate1Id, candidateNumber: 1, count: 18 },
          { candidateId: candidate2Id, candidateNumber: 2, count: 10 },
        ],
        invalidVotes: 2,
        totalVotes: 30, // net increase of 3 votes
        correctionReason: 'Koreksi formulir C1 plano hasil perhitungan ulang saksi TPS',
      });

    expect(res.status).toBe(200);
    expect(res.body.submission.revision).toBe(2);

    // Verify QuickCount total increased by exactly 3, NOT 30 (no double count)
    const qcAfter = await request(app).get('/api/quickcount');
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
          { candidateId: candidate1Id, candidateNumber: 1, count: 10 },
        ],
        invalidVotes: 0,
        totalVotes: 10,
        correctionReason: '', // Empty reason
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Alasan koreksi wajib diisi/);
  });
});
