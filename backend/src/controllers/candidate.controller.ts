import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Candidate, ICandidate } from '../models/Candidate.js';
import { User } from '../models/User.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AuditService } from '../services/audit.service.js';
import {
  createCandidateUserSchema,
  updateCandidateProfileSchema,
  verifyCandidateSchema,
} from '../validations/schemas.js';

export class CandidateController {
  /**
   * Get all candidates (Public / Admin with filters)
   */
  static async getAllCandidates(req: AuthRequest, res: Response): Promise<void> {
    const { status, publicationStatus, stage, search } = req.query;

    const query: any = {};

    // Filter by candidacy status (BAKAL_CALON, CALON_TETAP)
    if (status) {
      query.candidacyStatus = status;
    }

    // Public only sees published candidates unless requested by admin
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      query.publicationStatus = 'PUBLISHED';
    } else if (publicationStatus) {
      query.publicationStatus = publicationStatus;
    }

    // Filter by stage qualification
    if (stage === 'STAGE_2') {
      query.stage2Qualified = true;
    } else if (stage === 'STAGE_1') {
      query.stage1Qualified = true;
    }

    // Search by name or position
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { nickname: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
        { workUnit: { $regex: search, $options: 'i' } },
      ];
    }

    const candidates = await Candidate.find(query)
      .populate('presentationId')
      .sort({ candidateNumber: 1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  }

  /**
   * Get single candidate by ID
   */
  static async getCandidateById(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const candidate = await Candidate.findById(id).populate('presentationId');

    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Data kandidat tidak ditemukan.',
      });
      return;
    }

    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const isOwner = req.user?.candidateId === candidate._id.toString();

    // If draft and not admin / owner, return 404
    if (candidate.publicationStatus !== 'PUBLISHED' && !isAdmin && !isOwner) {
      res.status(404).json({
        success: false,
        message: 'Profil kandidat belum dipublikasikan.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  }

  /**
   * Admin: Create Candidate + Linked User Account
   */
  static async createCandidate(req: AuthRequest, res: Response): Promise<void> {
    const validated = createCandidateUserSchema.parse(req.body);

    // Check unique email and candidate number
    const existingEmail = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingEmail) {
      res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar untuk pengguna lain.',
      });
      return;
    }

    const existingNumber = await Candidate.findOne({ candidateNumber: validated.candidateNumber });
    if (existingNumber) {
      res.status(400).json({
        success: false,
        message: `Nomor urut ${validated.candidateNumber} sudah digunakan oleh kandidat lain.`,
      });
      return;
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create Candidate document
    const candidate = new Candidate({
      candidateNumber: validated.candidateNumber,
      fullName: validated.fullName,
      nickname: validated.nickname,
      position: validated.position,
      workUnit: validated.workUnit,
      department: validated.department,
      tenure: validated.tenure,
      vision: validated.vision || '',
      mission: validated.mission || [],
      expectations: validated.expectations || '',
      campaignMessage: validated.campaignMessage || '',
      candidacyStatus: 'BAKAL_CALON',
      verificationStatus: 'PENDING',
      publicationStatus: 'DRAFT',
      stage1Qualified: true,
      stage2Qualified: false,
    });

    await candidate.save();

    // Create User document linked to Candidate
    const user = new User({
      name: validated.fullName,
      email: validated.email.toLowerCase(),
      passwordHash,
      role: 'CANDIDATE',
      status: 'ACTIVE',
      candidateId: candidate._id,
      mustChangePassword: true,
    });

    await user.save();

    candidate.userId = user._id as any;
    await candidate.save();

    // Also link candidate to Stage 1 automatically if exists
    await ElectionStage.updateMany(
      { stageType: 'STAGE_1' },
      { $addToSet: { candidateIds: candidate._id } }
    );

    // Record audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'CANDIDATE_CREATED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      after: {
        candidateNumber: candidate.candidateNumber,
        fullName: candidate.fullName,
        email: user.email,
      },
      reason: 'Pendaftaran akun dan profil bakal calon ketua baru',
    });

    res.status(201).json({
      success: true,
      message: 'Akun dan profil bakal calon berhasil dibuat.',
      data: candidate,
    });
  }

  /**
   * Update candidate profile (Candidate self or Admin)
   */
  static async updateCandidateProfile(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = updateCandidateProfileSchema.parse(req.body);

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    const beforeState = candidate.toObject();

    // Apply updates
    Object.assign(candidate, validated);

    // If candidate self-edits, set verificationStatus to PENDING if required by admin review
    const isSelf = req.user?.candidateId === candidate._id.toString();
    if (isSelf && req.user?.role === 'CANDIDATE') {
      // Keep verified if small change or set pending review
      // We keep existing status or allow pending review
    }

    await candidate.save();

    // Record audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'User',
      actorRole: req.user?.role || 'CANDIDATE',
      action: 'CANDIDATE_PROFILE_UPDATED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      before: beforeState,
      after: candidate.toObject(),
      reason: 'Pembaruan data profil kandidat',
    });

    res.status(200).json({
      success: true,
      message: 'Profil kandidat berhasil diperbarui.',
      data: candidate,
    });
  }

  /**
   * Upload Profile Photo
   */
  static async uploadPhoto(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah.' });
      return;
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;
    candidate.profilePhoto = photoUrl;
    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Foto profil berhasil diunggah.',
      photoUrl,
    });
  }

  /**
   * Admin: Verify & Approve / Reject Candidate Data
   */
  static async verifyCandidate(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const validated = verifyCandidateSchema.parse(req.body);

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    const before = {
      verificationStatus: candidate.verificationStatus,
      publicationStatus: candidate.publicationStatus,
      candidacyStatus: candidate.candidacyStatus,
    };

    candidate.verificationStatus = validated.verificationStatus;
    if (validated.publicationStatus) {
      candidate.publicationStatus = validated.publicationStatus;
    }
    if (validated.rejectionReason) {
      candidate.rejectionReason = validated.rejectionReason;
    }
    if (validated.candidacyStatus) {
      candidate.candidacyStatus = validated.candidacyStatus;
    }

    await candidate.save();

    // Audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'CANDIDATE_VERIFIED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      before,
      after: {
        verificationStatus: candidate.verificationStatus,
        publicationStatus: candidate.publicationStatus,
        candidacyStatus: candidate.candidacyStatus,
      },
      reason: validated.rejectionReason || 'Verifikasi dan penetapan status publikasi kandidat',
    });

    res.status(200).json({
      success: true,
      message: `Status kandidat berhasil diubah menjadi ${candidate.verificationStatus} & ${candidate.publicationStatus}.`,
      data: candidate,
    });
  }

  /**
   * Admin: Delete or archive candidate
   */
  static async deleteCandidate(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    // Delete linked user if any
    if (candidate.userId) {
      await User.findByIdAndDelete(candidate.userId);
    }

    await Candidate.findByIdAndDelete(id);

    // Remove from stages
    await ElectionStage.updateMany({}, { $pull: { candidateIds: candidate._id } });

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'CANDIDATE_DELETED',
      entityType: 'Candidate',
      entityId: id,
      reason: `Menghapus kandidat #${candidate.candidateNumber} ${candidate.fullName}`,
    });

    res.status(200).json({
      success: true,
      message: 'Kandidat dan akun terkait berhasil dihapus.',
    });
  }
}
