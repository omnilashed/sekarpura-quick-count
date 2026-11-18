import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Presentation } from '../models/Presentation.js';
import { Candidate } from '../models/Candidate.js';
import { env } from '../config/env.js';
import { AuthRequest } from '../middlewares/auth.js';
import { PresentationService } from '../services/presentation.service.js';
import { AuditService } from '../services/audit.service.js';

export class PresentationController {
  /**
   * Upload presentation (Candidate self or Admin)
   */
  static async upload(req: AuthRequest, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Tidak ada file presentasi yang diunggah.' });
      return;
    }

    const { title, description } = req.body;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const targetCandidateId = isAdmin
      ? req.body.candidateId || req.user?.candidateId
      : req.user?.candidateId;

    if (!targetCandidateId) {
      res.status(403).json({ success: false, message: 'Akses ditolak. ID kandidat tidak valid.' });
      return;
    }

    const candidate = await Candidate.findById(targetCandidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase() as
      | 'pdf'
      | 'ppt'
      | 'pptx';

    // Check version
    const existingPres = await Presentation.findOne({ candidateId: candidate._id }).sort({
      version: -1,
    });
    const newVersion = existingPres ? existingPres.version + 1 : 1;

    const presentation = new Presentation({
      candidateId: candidate._id,
      title: title || `Presentasi Visi Misi - ${candidate.fullName}`,
      description: description || `Pemaparan gagasan dan komitmen Calon Ketua No. ${candidate.candidateNumber}`,
      originalFileName: req.file.originalname,
      originalFileKey: `presentations/${req.file.filename}`,
      fileType: ext,
      fileSize: req.file.size,
      version: newVersion,
      conversionStatus: 'PENDING',
      publicationStatus: 'PUBLISHED', // auto-publish or draft based on settings
    });

    await presentation.save();

    // Link to candidate
    candidate.presentationId = presentation._id as any;
    await candidate.save();

    // Process conversion in background / async
    PresentationService.processPresentation(presentation._id.toString())
      .then((updated) => {
        console.log(`[Presentation] Conversion completed for ID: ${updated._id}`);
      })
      .catch((err) => {
        console.error(`[Presentation] Conversion error for ID: ${presentation._id}`, err);
      });

    // Record audit
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
        version: presentation.version,
      },
      reason: 'Unggah file materi presentasi kandidat',
    });

    res.status(201).json({
      success: true,
      message: 'File materi presentasi berhasil diunggah dan sedang diproses.',
      data: presentation,
    });
  }

  /**
   * Get candidate presentation
   */
  static async getByCandidate(req: Request, res: Response): Promise<void> {
    const { candidateId } = req.params;
    const presentation = await Presentation.findOne({ candidateId })
      .populate('candidateId', 'fullName nickname candidateNumber position workUnit profilePhoto')
      .sort({ createdAt: -1 });

    if (!presentation) {
      res.status(404).json({ success: false, message: 'Presentasi belum diunggah.' });
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
      conversionStatus: 'COMPLETED',
    };

    const presentations = await Presentation.find(query)
      .populate('candidateId', 'fullName nickname candidateNumber position workUnit profilePhoto candidacyStatus stage1Qualified stage2Qualified')
      .sort({ createdAt: -1 });

    // Optional filter by candidate stage
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
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      res.status(404).json({ success: false, message: 'Presentasi tidak ditemukan.' });
      return;
    }

    const isOwner =
      req.user?.candidateId &&
      presentation.candidateId.toString() === req.user.candidateId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak berhak menghapus presentasi ini.',
      });
      return;
    }

    // Unlink candidate
    await Candidate.updateOne(
      { presentationId: presentation._id },
      { $unset: { presentationId: 1 } }
    );

    // Delete files on disk if they exist
    try {
      if (presentation.originalFileKey) {
        const origPath = path.resolve(env.UPLOAD_DIR, presentation.originalFileKey);
        if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
      }
      if (presentation.convertedFileKey) {
        const convPath = path.resolve(env.UPLOAD_DIR, presentation.convertedFileKey);
        if (fs.existsSync(convPath)) fs.unlinkSync(convPath);
      }
    } catch (e) {
      console.warn('[Presentation] File cleanup warning:', e);
    }

    await Presentation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'File materi presentasi berhasil dihapus.',
    });
  }
}
