import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Presentation } from '../models/Presentation.js';
import { Candidate } from '../models/Candidate.js';
import { AuthRequest } from '../middlewares/auth.js';
import { PresentationService, validateMagicBytes } from '../services/presentation.service.js';
import { GridFSService } from '../services/gridfs.service.js';
import { AuditService } from '../services/audit.service.js';

export class PresentationController {
  /**
   * Upload presentation (Candidate self or Admin)
   * Menyimpan file asli 100% byte-for-byte ke MongoDB GridFS dengan checksum SHA-256
   */
  static async upload(req: AuthRequest, res: Response): Promise<void> {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ success: false, message: 'Tidak ada file presentasi yang diunggah.' });
      return;
    }

    // 1. Validasi Magic Bytes biner
    const detected = validateMagicBytes(req.file.buffer);
    if (!detected) {
      res.status(400).json({
        success: false,
        message:
          'Validasi biner gagal: Format file tidak valid atau rusak. Hanya file asli PDF, PPTX, dan PPT yang diizinkan.',
      });
      return;
    }

    const { title, description } = req.body;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const targetCandidateId = isAdmin
      ? req.body.candidateId || req.user?.candidateId
      : req.user?.candidateId;

    if (!targetCandidateId) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak. Tidak ada asosiasi kandidat yang valid pada sesi ini.',
      });
      return;
    }

    const candidate = await Candidate.findById(targetCandidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan di database.' });
      return;
    }

    // 2. Simpan file asli ke MongoDB GridFS (tanpa transformasi apa pun)
    const uploadResult = await GridFSService.uploadBuffer(
      req.file.originalname,
      req.file.buffer,
      detected.mime,
      {
        candidateId: candidate._id,
        uploaderId: req.user?.id,
        uploadedAt: new Date(),
      }
    );

    // 3. Tentukan versi (versioning)
    const existingPres = await Presentation.findOne({ candidateId: candidate._id }).sort({
      version: -1,
    });
    const newVersion = existingPres ? existingPres.version + 1 : 1;

    // 4. Buat record metadata di MongoDB
    const isPdf = detected.ext === 'pdf';
    const presentation = new Presentation({
      candidateId: candidate._id,
      title: title || `Presentasi Visi Misi - ${candidate.fullName}`,
      description:
        description ||
        `Pemaparan gagasan dan komitmen Calon Ketua No. ${candidate.candidateNumber}`,
      originalFileName: req.file.originalname,
      storageKey: uploadResult.storageKey,
      fileType: detected.ext,
      mimeType: detected.mime,
      fileSize: uploadResult.size,
      sha256: uploadResult.sha256,
      gridFsFileId: uploadResult.fileId,
      previewGridFsFileId: isPdf ? uploadResult.fileId : undefined,
      version: newVersion,
      conversionStatus: isPdf ? 'COMPLETED' : 'PROCESSING',
      publicationStatus: 'PUBLISHED',
      uploadedAt: new Date(),
    });

    await presentation.save();

    // 5. Hubungkan kandidat dengan presentationId terbaru
    candidate.presentationId = presentation._id as any;
    await candidate.save();

    // 6. Jalankan pemrosesan metadata & preview terpisah secara asynchronous
    PresentationService.processPresentation(presentation._id.toString())
      .then((updated) => {
        console.log(`[Presentation] Pemrosesan selesai untuk ID: ${updated._id} (Status: ${updated.conversionStatus})`);
      })
      .catch((err) => {
        console.error(`[Presentation] Kesalahan pemrosesan untuk ID: ${presentation._id}`, err);
      });

    // 7. Catat audit trail
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'CANDIDATE',
      action: 'PRESENTATION_UPLOADED',
      entityType: 'Presentation',
      entityId: presentation._id.toString(),
      after: {
        title: presentation.title,
        fileName: presentation.originalFileName,
        fileType: presentation.fileType,
        fileSize: presentation.fileSize,
        sha256: presentation.sha256,
        version: presentation.version,
      },
      reason: 'Unggah file materi presentasi asli kandidat ke GridFS',
    });

    res.status(201).json({
      success: true,
      message: 'File materi presentasi asli berhasil disimpan dengan verifikasi SHA-256.',
      data: presentation,
    });
  }

  /**
   * Unduh file asli persis seperti yang diunggah (Streaming dari GridFS)
   */
  static async download(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID presentasi tidak valid.' });
      return;
    }

    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Materi presentasi tidak ditemukan.' });
      return;
    }

    const fileInfo = await GridFSService.getFileInfo(presentation.gridFsFileId);
    if (!fileInfo) {
      res.status(404).json({
        success: false,
        message: 'File fisik biner tidak ditemukan di penyimpanan GridFS.',
      });
      return;
    }

    // Set header HTTP ketat untuk unduhan file asli
    const safeName = encodeURIComponent(presentation.originalFileName);
    res.setHeader('Content-Type', presentation.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"; filename*=UTF-8''${safeName}`
    );
    res.setHeader('Content-Length', presentation.fileSize);
    res.setHeader('ETag', `"${presentation.sha256}"`);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Checksum-SHA256', presentation.sha256);

    const downloadStream = GridFSService.openDownloadStream(presentation.gridFsFileId);
    downloadStream.on('error', (err) => {
      console.error('[PresentationController] Download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Gagal mengalirkan stream file presentasi.' });
      }
    });

    downloadStream.pipe(res);
  }

  /**
   * Preview streaming (PDF viewable di browser)
   */
  static async preview(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID presentasi tidak valid.' });
      return;
    }

    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Materi presentasi tidak ditemukan.' });
      return;
    }

    // Tentukan fileId untuk preview (PDF langsung, atau artefak PDF terkonversi)
    const previewFileId =
      presentation.previewGridFsFileId ||
      (presentation.fileType === 'pdf' ? presentation.gridFsFileId : null);

    if (!previewFileId) {
      res.status(404).json({
        success: false,
        code: 'PREVIEW_UNAVAILABLE',
        message:
          'Pratinjau PDF belum tersedia untuk file ini. Harap gunakan tombol "Unduh File Asli" untuk membuka di PowerPoint/Keynote.',
      });
      return;
    }

    // Izinkan preview di-embed di iframe dan object tag (Vercel, localhost, dll)
    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Security-Policy', "frame-ancestors *; object-src * blob: data:;");
    res.setHeader('Content-Type', 'application/pdf');
    const safeName = encodeURIComponent(presentation.originalFileName);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('ETag', `"${presentation.sha256}-preview"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const previewStream = GridFSService.openDownloadStream(previewFileId);
    previewStream.on('error', (err) => {
      console.error('[PresentationController] Preview stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Gagal mengalirkan preview PDF.' });
      }
    });

    previewStream.pipe(res);
  }

  /**
   * Verifikasi integritas checksum SHA-256 secara langsung dari GridFS
   */
  static async verifyChecksum(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID presentasi tidak valid.' });
      return;
    }

    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Materi presentasi tidak ditemukan.' });
      return;
    }

    try {
      const buffer = await GridFSService.getFileBuffer(presentation.gridFsFileId);
      const computedSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      const isMatch = computedSha256 === presentation.sha256;

      res.status(200).json({
        success: true,
        data: {
          presentationId: presentation._id,
          fileName: presentation.originalFileName,
          fileSize: presentation.fileSize,
          gridFsBytes: buffer.length,
          storedSha256: presentation.sha256,
          computedSha256,
          isIntegrityValid: isMatch,
          version: presentation.version,
          uploadedAt: presentation.uploadedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `Gagal membaca file dari GridFS untuk verifikasi: ${err.message}`,
      });
    }
  }

  /**
   * Get candidate presentation
   */
  static async getByCandidate(req: Request, res: Response): Promise<void> {
    const { candidateId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      res.status(400).json({ success: false, message: 'ID kandidat tidak valid.' });
      return;
    }

    const presentation = await Presentation.findOne({ candidateId })
      .populate('candidateId', 'fullName nickname candidateNumber position workUnit profilePhoto')
      .sort({ version: -1, createdAt: -1 });

    if (!presentation) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'Presentasi belum diunggah.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: presentation,
    });
  }

  /**
   * Get single presentation by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID presentasi tidak valid.' });
      return;
    }

    const presentation = await Presentation.findById(id).populate(
      'candidateId',
      'fullName nickname candidateNumber position workUnit profilePhoto candidacyStatus'
    );

    if (!presentation) {
      res.status(404).json({ success: false, message: 'Presentasi tidak ditemukan.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: presentation,
    });
  }

  /**
   * Public: Get all published presentations library
   */
  static async getAllPublished(req: Request, res: Response): Promise<void> {
    const { stage } = req.query;

    const query: any = {
      publicationStatus: 'PUBLISHED',
    };

    const presentations = await Presentation.find(query)
      .populate(
        'candidateId',
        'fullName nickname candidateNumber position workUnit profilePhoto candidacyStatus stage1Qualified stage2Qualified'
      )
      .sort({ createdAt: -1 });

    const filtered = presentations.filter((p: any) => {
      if (!p.candidateId) return false;
      if (stage === 'STAGE_2') {
        return p.candidateId.stage2Qualified === true;
      }
      return true;
    });

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  }

  /**
   * Admin: Update presentation status (publish/unpublish)
   */
  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { publicationStatus } = req.body;

    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Presentasi tidak ditemukan.' });
      return;
    }

    presentation.publicationStatus = publicationStatus;
    await presentation.save();

    res.status(200).json({
      success: true,
      message: `Status presentasi berhasil diubah menjadi ${publicationStatus}.`,
      data: presentation,
    });
  }

  /**
   * Delete presentation
   */
  static async deletePresentation(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID presentasi tidak valid.' });
      return;
    }

    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Presentasi tidak ditemukan.' });
      return;
    }

    const isOwner =
      req.user?.candidateId &&
      presentation.candidateId.toString() === req.user.candidateId.toString();
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak berhak menghapus materi presentasi ini.',
      });
      return;
    }

    // 1. Hapus artefak fisik dari MongoDB GridFS
    if (presentation.gridFsFileId) {
      await GridFSService.deleteFile(presentation.gridFsFileId);
    }
    if (presentation.previewGridFsFileId && !presentation.previewGridFsFileId.equals(presentation.gridFsFileId)) {
      await GridFSService.deleteFile(presentation.previewGridFsFileId);
    }

    // 2. Unlink dari kandidat
    await Candidate.updateOne(
      { presentationId: presentation._id },
      { $unset: { presentationId: 1 } }
    );

    // 3. Hapus record database
    await Presentation.findByIdAndDelete(id);

    // 4. Audit trail
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'CANDIDATE',
      action: 'PRESENTATION_DELETED',
      entityType: 'Presentation',
      entityId: id,
      before: {
        title: presentation.title,
        fileName: presentation.originalFileName,
        version: presentation.version,
      },
      reason: 'Hapus materi presentasi kandidat',
    });

    res.status(200).json({
      success: true,
      message: 'File materi presentasi berhasil dihapus dari sistem dan penyimpanan.',
    });
  }
}
