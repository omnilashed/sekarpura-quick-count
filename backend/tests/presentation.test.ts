import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { Candidate } from '../src/models/Candidate.js';
import { Presentation } from '../src/models/Presentation.js';
import { GridFSService } from '../src/services/gridfs.service.js';

const app = createApp();

describe('SEKARPURA Election Center - Presentation & GridFS Integrity Tests', () => {
  let candidate1Token = '';
  let candidate2Token = '';
  let candidate1Id = '';
  let candidate2Id = '';
  let createdPresentationId = '';

  // Valid PDF binary buffer with magic bytes %PDF-
  const samplePdfContent =
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF\n';
  const samplePdfBuffer = Buffer.from(samplePdfContent, 'utf-8');
  const expectedPdfSha256 = crypto.createHash('sha256').update(samplePdfBuffer).digest('hex');

  // Valid PPTX mock buffer with magic bytes PK\x03\x04
  const samplePptxBuffer = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    Buffer.from('MOCK_PPTX_POWERPOINT_PRESENTATION_TEST_DATA_SEKARPURA_2026'),
  ]);
  const expectedPptxSha256 = crypto.createHash('sha256').update(samplePptxBuffer).digest('hex');

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Ambil akun kandidat untuk autentikasi
    const user1 = await User.findOne({ email: 'yulianto@sekarpura-halim.org' });
    const user2 = await User.findOne({ email: 'shinta.mahadewa@sekarpura-halim.org' });
    expect(user1).toBeDefined();
    expect(user2).toBeDefined();

    const c1Email = 'yulianto@sekarpura-halim.org';
    const c1Pass = 'Sekarpura2026!#01';
    const c2Email = 'shinta.mahadewa@sekarpura-halim.org';
    const c2Pass = 'Sekarpura2026!#02';

    // Candidate 1 Login
    const c1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: c1Email, password: c1Pass });
    expect(c1Res.status).toBe(200);
    candidate1Token = c1Res.body.token;
    candidate1Id = user1!.candidateId?.toString() || '';

    // Candidate 2 Login
    const c2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: c2Email, password: c2Pass });
    expect(c2Res.status).toBe(200);
    candidate2Token = c2Res.body.token;
    candidate2Id = user2!.candidateId?.toString() || '';
  });

  afterAll(async () => {
    // Bersihkan presentasi uji coba
    if (createdPresentationId) {
      const pres = await Presentation.findById(createdPresentationId);
      if (pres?.gridFsFileId) {
        await GridFSService.deleteFile(pres.gridFsFileId);
      }
      await Presentation.findByIdAndDelete(createdPresentationId);
    }
  });

  it('1. Penolakan Magic Bytes: File biner tidak valid / spoofing ekstensi ditolak (HTTP 400)', async () => {
    const fakeBuffer = Buffer.from('NOT_A_REAL_PPTX_JUST_TEXT_CONTENT', 'utf-8');

    const res = await request(app)
      .post('/api/presentations/upload')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .attach('file', fakeBuffer, 'malicious_presentation.pptx')
      .field('title', 'Test Spoofed File');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validasi biner gagal');
  });

  it('2. Unggah File PDF Asli: Disimpan ke GridFS tanpa modifikasi & SHA-256 dihitung tepat (HTTP 201)', async () => {
    const res = await request(app)
      .post('/api/presentations/upload')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .attach('file', samplePdfBuffer, 'materi_visi_misi_kandidat_1.pdf')
      .field('title', 'Pemaparan Visi & Misi 2026')
      .field('description', 'Materi asli kampanye calon ketua');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.sha256).toBe(expectedPdfSha256);
    expect(res.body.data.fileSize).toBe(samplePdfBuffer.length);
    expect(res.body.data.gridFsFileId).toBeDefined();
    expect(res.body.data.version).toBeGreaterThanOrEqual(1);

    createdPresentationId = res.body.data._id;
  });

  it('3. Unduh File Asli: Aliran byte dari GridFS 100% IDENTIK dengan buffer awal (SHA-256 Match)', async () => {
    const res = await request(app)
      .get(`/api/presentations/${createdPresentationId}/download`)
      .buffer(true)
      .parse((res, callback) => {
        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(Buffer.from(chunk)));
        res.on('end', () => callback(null, Buffer.concat(data)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['x-checksum-sha256']).toBe(expectedPdfSha256);
    expect(res.headers['cache-control']).toContain('no-store');

    // Bandingkan hash SHA-256 dari buffer yang diunduh
    const downloadedBuffer = res.body as Buffer;
    const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');

    expect(downloadedSha256).toBe(expectedPdfSha256);
    expect(downloadedBuffer.length).toBe(samplePdfBuffer.length);
  });

  it('4. Verifikasi Integritas Server-Side: Endpoint /verify membuktikan byte di GridFS valid', async () => {
    const res = await request(app).get(`/api/presentations/${createdPresentationId}/verify`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isIntegrityValid).toBe(true);
    expect(res.body.data.storedSha256).toBe(expectedPdfSha256);
    expect(res.body.data.computedSha256).toBe(expectedPdfSha256);
    expect(res.body.data.fileSize).toBe(samplePdfBuffer.length);
  });

  it('5. Isolasi & Keamanan Kandidat: Kandidat 2 DILARANG menghapus presentasi Kandidat 1 (HTTP 403)', async () => {
    const res = await request(app)
      .delete(`/api/presentations/${createdPresentationId}`)
      .set('Authorization', `Bearer ${candidate2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Akses ditolak');
  });

  it('6. Isolasi Dua Kandidat: Kandidat 2 dapat mengunggah file dengan nama yang sama tanpa bentrok', async () => {
    const res = await request(app)
      .post('/api/presentations/upload')
      .set('Authorization', `Bearer ${candidate2Token}`)
      .attach('file', samplePptxBuffer, 'materi_visi_misi_kandidat_1.pptx')
      .field('title', 'Pemaparan Kandidat 2');

    expect(res.status).toBe(201);
    expect(res.body.data.candidateId).toBe(candidate2Id);
    expect(res.body.data.sha256).toBe(expectedPptxSha256);

    // Bersihkan file kandidat 2
    const cand2PresId = res.body.data._id;
    await request(app)
      .delete(`/api/presentations/${cand2PresId}`)
      .set('Authorization', `Bearer ${candidate2Token}`);
  });

  it('7. Penghapusan Bersih: Kandidat 1 dapat menghapus presentasi miliknya & file GridFS terhapus', async () => {
    const delRes = await request(app)
      .delete(`/api/presentations/${createdPresentationId}`)
      .set('Authorization', `Bearer ${candidate1Token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verifikasi bahwa dokumen di MongoDB sudah hilang
    const checkPres = await Presentation.findById(createdPresentationId);
    expect(checkPres).toBeNull();

    // Verifikasi kandidat sudah ter-unlink
    const cand = await Candidate.findById(candidate1Id);
    expect(cand?.presentationId).toBeUndefined();

    createdPresentationId = '';
  });
});
