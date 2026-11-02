import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { QuickCountService } from '../services/quickcount.service.js';
import { VoteSource } from '../models/VoteSource.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AuditService } from '../services/audit.service.js';
import {
  broadcastQuickCountUpdate,
  broadcastSourceVerified,
} from '../config/socket.js';
import {
  createVoteSourceSchema,
  submitVotesSchema,
} from '../validations/schemas.js';

export class QuickCountController {
  /**
   * Get QuickCount Results (Public / Admin)
   */
  static async getQuickCount(req: Request, res: Response): Promise<void> {
    const { stageId } = req.query;

    let result;
    if (stageId && typeof stageId === 'string') {
      result = await QuickCountService.calculateStageQuickCount(stageId);
    } else {
      result = await QuickCountService.getActiveStageQuickCount();
    }

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Data perhitungan suara belum tersedia.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  /**
   * Get all Vote Sources for a stage
   */
  static async getVoteSources(req: Request, res: Response): Promise<void> {
    const { stageId } = req.query;
    if (!stageId) {
      res.status(400).json({ success: false, message: 'stageId diperlukan.' });
      return;
    }

    const sources = await VoteSource.find({ stageId })
      .populate({
        path: 'activeSubmissionId',
        select: 'votes invalidVotes totalVotes revision verificationStatus createdAt submittedBy',
        populate: { path: 'submittedBy', select: 'name email' },
      })
      .sort({ sourceCode: 1 });

    res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  }

  /**
   * Admin: Create Vote Source / TPS
   */
  static async createVoteSource(req: AuthRequest, res: Response): Promise<void> {
    const { stageId } = req.body;
    const validated = createVoteSourceSchema.parse(req.body);

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    // Check duplicate code in stage
    const existing = await VoteSource.findOne({ stageId, sourceCode: validated.sourceCode });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Sumber suara dengan kode '${validated.sourceCode}' sudah ada pada tahap ini.`,
      });
      return;
    }

    const source = new VoteSource({
      electionId: stage.electionId,
      stageId: stage._id,
      sourceCode: validated.sourceCode,
      sourceName: validated.sourceName,
      workUnit: validated.workUnit,
      location: validated.location,
      targetVoters: validated.targetVoters || 0,
      status: 'NOT_SUBMITTED',
    });

    await source.save();

    res.status(201).json({
      success: true,
      message: 'Sumber suara / TPS berhasil didaftarkan.',
      data: source,
    });
  }

  /**
   * Admin: Submit Votes from a Source (Initial Entry)
   */
  static async submitVotes(req: AuthRequest, res: Response): Promise<void> {
    const validated = submitVotesSchema.parse(req.body);

    const stage = await ElectionStage.findById(validated.stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    if (stage.status === 'LOCKED' || stage.status === 'COMPLETED') {
      res.status(403).json({
        success: false,
        message: 'Tahap pemilihan telah dikunci/selesai. Tidak dapat memasukkan suara baru.',
      });
      return;
    }

    const source = await VoteSource.findById(validated.sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Sumber suara / TPS tidak ditemukan.' });
      return;
    }

    // Integrity check: Check if submission already exists
    const existingSubmission = await VoteSubmission.findOne({
      stageId: stage._id,
      sourceId: source._id,
      isLatestRevision: true,
    });

    if (existingSubmission) {
      res.status(409).json({
        success: false,
        message:
          'Data suara untuk sumber ini sudah pernah dimasukkan. Gunakan fitur Koreksi Suara dengan mencantumkan alasan revisi.',
      });
      return;
    }

    // Total verification: candidate sum + invalidVotes == totalVotes
    const sumCandidateVotes = validated.votes.reduce((acc, curr) => acc + curr.count, 0);
    const calculatedTotal = sumCandidateVotes + validated.invalidVotes;

    if (calculatedTotal !== validated.totalVotes) {
      res.status(400).json({
        success: false,
        message: `Integritas total suara tidak valid: Rincian (${sumCandidateVotes} suara sah + ${validated.invalidVotes} tidak sah = ${calculatedTotal}) tidak cocok dengan total yang diinput (${validated.totalVotes}).`,
      });
      return;
    }

    // Create VoteSubmission
    const submission = new VoteSubmission({
      electionId: stage.electionId,
      stageId: stage._id,
      sourceId: source._id,
      votes: validated.votes.map((v) => ({
        candidateId: new mongoose.Types.ObjectId(v.candidateId),
        candidateNumber: v.candidateNumber,
        count: v.count,
      })),
      invalidVotes: validated.invalidVotes,
      totalVotes: validated.totalVotes,
      revision: 1,
      isLatestRevision: true,
      verificationStatus: 'VERIFIED',
      submittedBy: req.user?.id,
      verifiedBy: req.user?.id,
      verifiedAt: new Date(),
      notes: validated.notes,
      idempotencyKey: validated.idempotencyKey,
    });

    await submission.save();

    // Update source status
    source.status = 'VERIFIED';
    source.activeSubmissionId = submission._id as any;
    await source.save();

    // Recalculate quickcount
    const quickcountData = await QuickCountService.calculateStageQuickCount(stage._id.toString());

    // Broadcast updates via Socket.IO
    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData,
      leaderChanged: quickcountData.leaderChanged,
      message: `Data suara baru dari ${source.sourceCode} (${source.sourceName}) berhasil diverifikasi.`,
    });

    broadcastSourceVerified({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      sourceId: source._id.toString(),
      sourceName: source.sourceName,
      status: 'VERIFIED',
    });

    // Record audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'VOTE_SUBMITTED',
      entityType: 'VoteSubmission',
      entityId: submission._id.toString(),
      after: {
        sourceCode: source.sourceCode,
        totalVotes: submission.totalVotes,
        validVotes: sumCandidateVotes,
        invalidVotes: submission.invalidVotes,
      },
      reason: validated.notes || `Input suara resmi rekapitulasi ${source.sourceCode}`,
    });

    res.status(201).json({
      success: true,
      message: `Data suara dari ${source.sourceName} berhasil disimpan dan disiarkan secara real-time.`,
      submission,
      quickcount: quickcountData,
    });
  }

  /**
   * Admin: Correct Votes from an Existing Source (Revision with Audit Trail)
   */
  static async correctVotes(req: AuthRequest, res: Response): Promise<void> {
    const validated = submitVotesSchema.parse(req.body);

    if (!validated.correctionReason || validated.correctionReason.trim().length < 5) {
      res.status(400).json({
        success: false,
        message: 'Alasan koreksi wajib diisi secara jelas (minimal 5 karakter) untuk kepatuhan audit.',
      });
      return;
    }

    const stage = await ElectionStage.findById(validated.stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    if (stage.status === 'LOCKED') {
      res.status(403).json({
        success: false,
        message: 'Tahap pemilihan telah dikunci. Koreksi suara tidak diizinkan lagi.',
      });
      return;
    }

    const source = await VoteSource.findById(validated.sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Sumber suara tidak ditemukan.' });
      return;
    }

    // Find previous latest revision
    const prevSubmission = await VoteSubmission.findOne({
      stageId: stage._id,
      sourceId: source._id,
      isLatestRevision: true,
    });

    if (!prevSubmission) {
      res.status(404).json({
        success: false,
        message: 'Tidak ditemukan data rekap sebelumnya untuk dikoreksi.',
      });
      return;
    }

    // Total verification
    const sumCandidateVotes = validated.votes.reduce((acc, curr) => acc + curr.count, 0);
    const calculatedTotal = sumCandidateVotes + validated.invalidVotes;

    if (calculatedTotal !== validated.totalVotes) {
      res.status(400).json({
        success: false,
        message: `Integritas total suara tidak valid: Rincian (${sumCandidateVotes} + ${validated.invalidVotes} = ${calculatedTotal}) tidak sesuai total (${validated.totalVotes}).`,
      });
      return;
    }

    // Mark previous as not latest
    prevSubmission.isLatestRevision = false;
    await prevSubmission.save();

    // Create new revision
    const newRevisionNumber = (prevSubmission.revision || 1) + 1;
    const newSubmission = new VoteSubmission({
      electionId: stage.electionId,
      stageId: stage._id,
      sourceId: source._id,
      votes: validated.votes.map((v) => ({
        candidateId: new mongoose.Types.ObjectId(v.candidateId),
        candidateNumber: v.candidateNumber,
        count: v.count,
      })),
      invalidVotes: validated.invalidVotes,
      totalVotes: validated.totalVotes,
      revision: newRevisionNumber,
      isLatestRevision: true,
      verificationStatus: 'VERIFIED',
      submittedBy: req.user?.id,
      verifiedBy: req.user?.id,
      verifiedAt: new Date(),
      notes: validated.notes,
      correctionReason: validated.correctionReason,
    });

    await newSubmission.save();

    // Point source to newest submission
    source.activeSubmissionId = newSubmission._id as any;
    source.status = 'VERIFIED';
    await source.save();

    // Recalculate without double-counting (clean aggregate)
    const quickcountData = await QuickCountService.calculateStageQuickCount(stage._id.toString());

    // Broadcast
    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData,
      leaderChanged: quickcountData.leaderChanged,
      message: `Koreksi data suara pada ${source.sourceCode} (Revisi #${newRevisionNumber}) berhasil diverifikasi.`,
    });

    // Record audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'VOTE_CORRECTION',
      entityType: 'VoteSubmission',
      entityId: newSubmission._id.toString(),
      before: {
        revision: prevSubmission.revision,
        totalVotes: prevSubmission.totalVotes,
        invalidVotes: prevSubmission.invalidVotes,
        votes: prevSubmission.votes,
      },
      after: {
        revision: newSubmission.revision,
        totalVotes: newSubmission.totalVotes,
        invalidVotes: newSubmission.invalidVotes,
        votes: newSubmission.votes,
      },
      reason: validated.correctionReason,
    });

    res.status(200).json({
      success: true,
      message: `Koreksi data suara (Revisi #${newRevisionNumber}) berhasil disimpan dan disinkronkan.`,
      submission: newSubmission,
      quickcount: quickcountData,
    });
  }

  /**
   * Get submission history / revision ledger for a source
   */
  static async getSubmissionHistory(req: Request, res: Response): Promise<void> {
    const { sourceId } = req.params;

    const history = await VoteSubmission.find({ sourceId })
      .populate('submittedBy', 'name email role')
      .sort({ revision: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  }
}
