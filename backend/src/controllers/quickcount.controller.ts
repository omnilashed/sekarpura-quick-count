import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { QuickCountService } from '../services/quickcount.service.js';
import { VoteSource } from '../models/VoteSource.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { Candidate } from '../models/Candidate.js';
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

async function syncStageTargetVotes(stageId: mongoose.Types.ObjectId | string): Promise<void> {
  const allSources = await VoteSource.find({ stageId });
  const totalTargetVoters = allSources.reduce((sum, s) => sum + (s.targetVoters || 0), 0);
  if (totalTargetVoters > 0) {
    await ElectionStage.findByIdAndUpdate(stageId, {
      targetVotes: totalTargetVoters,
      totalEligibleVoters: totalTargetVoters,
    });
  }
  QuickCountService.invalidateCache(stageId.toString());
  const updatedQc = await QuickCountService.calculateStageQuickCount(stageId.toString(), true).catch(() => null);
  if (updatedQc) {
    broadcastQuickCountUpdate({
      electionId: updatedQc.electionId,
      stageId: updatedQc.stageId,
      quickcountData: updatedQc,
      leaderChanged: updatedQc.leaderChanged,
      message: `Target surat suara diperbarui (${updatedQc.targetVotes} suara)`,
    });
  }
}

export class QuickCountController {
  /**
   * Get QuickCount Results (Public / Admin)
   */
  static async getQuickCount(req: Request, res: Response): Promise<void> {
    const { stageId, round } = req.query;

    let result;
    if (stageId && typeof stageId === 'string') {
      result = await QuickCountService.calculateStageQuickCount(
        stageId,
        false,
        round ? Number(round) : undefined
      );
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
        select: 'votes invalidVotes totalVotes revision verificationStatus isFinalSaved createdAt submittedBy',
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
    await syncStageTargetVotes(stage._id);

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

    if (source.stageId.toString() !== stage._id.toString()) {
      res.status(400).json({
        success: false,
        message: 'Sumber suara / TPS tidak sesuai dengan tahap pemilihan yang dipilih.',
      });
      return;
    }

    // Integrity check: Verify candidates belong to this stage
    const stageCandIds = stage.candidateIds.map((c: any) => c.toString());
    for (const v of validated.votes) {
      if (!stageCandIds.includes(v.candidateId)) {
        res.status(400).json({
          success: false,
          message: `Kandidat dengan ID '${v.candidateId}' tidak terdaftar pada tahap pemilihan ini.`,
        });
        return;
      }
    }

    const targetRound =
      req.body.round !== undefined ? Number(req.body.round) : (stage.activeRound || 1);

    const roundQuery: any =
      targetRound === 1 ? { $or: [{ round: 1 }, { round: { $exists: false } }] } : { round: targetRound };

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

    // Check if submission already exists for this round
    const existingSubmission = await VoteSubmission.findOne({
      stageId: stage._id,
      sourceId: source._id,
      ...roundQuery,
      isLatestRevision: true,
    }).sort({ revision: -1, createdAt: -1 });

    let submission: any;
    let isRevision = false;

    const isAlreadySaved =
      Boolean(existingSubmission?.isFinalSaved) ||
      (existingSubmission && existingSubmission.verificationStatus === 'VERIFIED') ||
      source.status === 'VERIFIED';

    if (existingSubmission && isAlreadySaved) {
      // Data TPS Putaran ini SUDAH PERNAH DISAVE RESMI / DIVERIFIKASI sebelumnya.
      // Sesuai aturan tata tertib: jika ada "save ulang / koreksi", maka wajib mencantumkan alasan revisi!
      const reason = validated.correctionReason?.trim();
      if (!reason || reason.length === 0) {
        res.status(409).json({
          success: false,
          needsCorrectionReason: true,
          message: `Data suara Putaran ${targetRound} untuk sumber ini sudah pernah dimasukkan / disimpan secara resmi. Gunakan fitur Koreksi Suara dengan mencantumkan alasan revisi.`,
        });
        return;
      }

      // Arsipkan submission lama
      existingSubmission.isLatestRevision = false;
      await existingSubmission.save();

      // Buat revisi baru
      submission = new VoteSubmission({
        electionId: stage.electionId,
        stageId: stage._id,
        sourceId: source._id,
        round: targetRound,
        votes: validated.votes.map((v) => ({
          candidateId: new mongoose.Types.ObjectId(v.candidateId),
          candidateNumber: v.candidateNumber,
          count: v.count,
        })),
        invalidVotes: validated.invalidVotes,
        totalVotes: validated.totalVotes,
        revision: (existingSubmission.revision || 1) + 1,
        isLatestRevision: true,
        isFinalSaved: true,
        verificationStatus: 'VERIFIED',
        submittedBy: req.user?.id,
        verifiedBy: req.user?.id,
        verifiedAt: new Date(),
        notes: validated.notes,
        correctionReason: reason,
        idempotencyKey: validated.idempotencyKey,
      });
      await submission.save();
      isRevision = true;
    } else if (existingSubmission) {
      // Submission berasal dari Live Tally yang belum di-save resmi -> Simpan dan finalisasi!
      existingSubmission.votes = validated.votes.map((v) => ({
        candidateId: new mongoose.Types.ObjectId(v.candidateId),
        candidateNumber: v.candidateNumber,
        count: v.count,
      }));
      existingSubmission.invalidVotes = validated.invalidVotes;
      existingSubmission.totalVotes = validated.totalVotes;
      existingSubmission.round = targetRound;
      existingSubmission.isFinalSaved = true;
      existingSubmission.verificationStatus = 'VERIFIED';
      existingSubmission.verifiedBy = req.user?.id;
      existingSubmission.verifiedAt = new Date();
      if (validated.notes) existingSubmission.notes = validated.notes;
      await existingSubmission.save();
      submission = existingSubmission;
    } else {
      // Belum ada submission sama sekali -> Simpan baru dan finalisasi
      submission = new VoteSubmission({
        electionId: stage.electionId,
        stageId: stage._id,
        sourceId: source._id,
        round: targetRound,
        votes: validated.votes.map((v) => ({
          candidateId: new mongoose.Types.ObjectId(v.candidateId),
          candidateNumber: v.candidateNumber,
          count: v.count,
        })),
        invalidVotes: validated.invalidVotes,
        totalVotes: validated.totalVotes,
        revision: 1,
        isLatestRevision: true,
        isFinalSaved: true,
        verificationStatus: 'VERIFIED',
        submittedBy: req.user?.id,
        verifiedBy: req.user?.id,
        verifiedAt: new Date(),
        notes: validated.notes,
        idempotencyKey: validated.idempotencyKey,
      });
      await submission.save();
    }

    // Update source status
    source.status = 'VERIFIED';
    source.activeSubmissionId = submission._id as any;
    await source.save();

    // Invalidate cache & recalculate quickcount freshly
    QuickCountService.invalidateCache(stage._id.toString());
    const quickcountData = await QuickCountService.calculateStageQuickCount(
      stage._id.toString(),
      true,
      targetRound
    );

    // Broadcast updates via Socket.IO
    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData,
      leaderChanged: quickcountData.leaderChanged,
      message: isRevision
        ? `Koreksi data suara (${source.sourceName}) Revisi #${submission.revision} berhasil disimpan.`
        : `Data suara Putaran ${targetRound} dari ${source.sourceName} resmi disimpan & diverifikasi.`,
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
      action: isRevision ? 'VOTE_CORRECTION_SUBMITTED' : 'VOTE_SUBMITTED',
      entityType: 'VoteSubmission',
      entityId: submission._id.toString(),
      after: {
        sourceCode: source.sourceCode,
        round: targetRound,
        revision: submission.revision,
        totalVotes: submission.totalVotes,
        validVotes: sumCandidateVotes,
        invalidVotes: submission.invalidVotes,
        isFinalSaved: true,
      },
      reason: isRevision
        ? validated.correctionReason
        : validated.notes || `Input suara resmi rekapitulasi Putaran ${targetRound} ${source.sourceCode}`,
    });

    res.status(isRevision ? 200 : 201).json({
      success: true,
      message: isRevision
        ? `Koreksi data suara Putaran ${targetRound} (Revisi #${submission.revision}) berhasil disimpan!`
        : `Data suara Putaran ${targetRound} dari ${source.sourceName} berhasil disimpan resmi ke database!`,
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

    if (source.stageId.toString() !== stage._id.toString()) {
      res.status(400).json({
        success: false,
        message: 'Sumber suara / TPS tidak sesuai dengan tahap pemilihan yang dipilih.',
      });
      return;
    }

    // Integrity check: Verify candidates belong to this stage
    const stageCandIds = stage.candidateIds.map((c: any) => c.toString());
    for (const v of validated.votes) {
      if (!stageCandIds.includes(v.candidateId)) {
        res.status(400).json({
          success: false,
          message: `Kandidat dengan ID '${v.candidateId}' tidak terdaftar pada tahap pemilihan ini.`,
        });
        return;
      }
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

    // Invalidate cache & recalculate without double-counting (clean aggregate)
    QuickCountService.invalidateCache(stage._id.toString());
    const quickcountData = await QuickCountService.calculateStageQuickCount(stage._id.toString(), true);

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
   * Admin: Update Vote Source / TPS
   */
  static async updateVoteSource(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { sourceCode, sourceName, workUnit, location, targetVoters } = req.body;

    const source = await VoteSource.findById(id);
    if (!source) {
      res.status(404).json({ success: false, message: 'Sumber suara / TPS tidak ditemukan.' });
      return;
    }

    if (sourceCode && sourceCode.toUpperCase() !== source.sourceCode) {
      const existing = await VoteSource.findOne({
        stageId: source.stageId,
        sourceCode: sourceCode.toUpperCase(),
        _id: { $ne: source._id },
      });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Kode sumber suara '${sourceCode.toUpperCase()}' sudah digunakan pada tahap ini.`,
        });
        return;
      }
      source.sourceCode = sourceCode.toUpperCase();
    }

    if (sourceName) source.sourceName = sourceName;
    if (workUnit) source.workUnit = workUnit;
    if (location) source.location = location;
    if (targetVoters !== undefined) source.targetVoters = Number(targetVoters);

    await source.save();
    await syncStageTargetVotes(source.stageId);

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'VOTE_SOURCE_UPDATED',
      entityType: 'VOTE_SOURCE',
      entityId: source._id.toString(),
      details: { sourceCode: source.sourceCode, sourceName: source.sourceName },
      reason: `Pembaruan data TPS/Sumber Suara ${source.sourceCode}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Sumber suara / TPS berhasil diperbarui.',
      data: source,
    });
  }

  /**
   * Admin: Delete Vote Source / TPS
   */
  static async deleteVoteSource(req: AuthRequest, res: Response): Promise<void> {
    const { id } = req.params;

    const source = await VoteSource.findById(id);
    if (!source) {
      res.status(404).json({ success: false, message: 'Sumber suara / TPS tidak ditemukan.' });
      return;
    }

    if (source.status === 'VERIFIED') {
      res.status(403).json({
        success: false,
        message: 'Sumber suara ini telah diverifikasi dan memiliki data suara resmi. Tidak dapat dihapus.',
      });
      return;
    }

    // Delete any draft submissions associated with this source
    await VoteSubmission.deleteMany({ sourceId: source._id });
    await VoteSource.findByIdAndDelete(source._id);
    await syncStageTargetVotes(source.stageId);

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'VOTE_SOURCE_DELETED',
      entityType: 'VOTE_SOURCE',
      entityId: source._id.toString(),
      details: { sourceCode: source.sourceCode, sourceName: source.sourceName },
      reason: `Penghapusan data TPS/Sumber Suara ${source.sourceCode}`,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Sumber suara ${source.sourceCode} berhasil dihapus.`,
    });
  }

  /**
   * Admin: Live Tally (+1 / -1 per surat suara tanpa syarat revisi)
   */
  static async liveTally(req: AuthRequest, res: Response): Promise<void> {
    const {
      stageId,
      sourceId,
      candidateId,
      isInvalidVote,
      delta = 1,
      votes,
      invalidVotes,
      round,
    } = req.body;

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    if (stage.status === 'LOCKED' || stage.status === 'COMPLETED') {
      res.status(403).json({
        success: false,
        message: 'Tahap pemilihan telah dikunci/selesai.',
      });
      return;
    }

    const source = await VoteSource.findById(sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Sumber suara tidak ditemukan.' });
      return;
    }

    const targetRound = round !== undefined ? Number(round) : (stage.activeRound || 1);
    const roundQuery: any =
      targetRound === 1 ? { $or: [{ round: 1 }, { round: { $exists: false } }] } : { round: targetRound };

    // Find existing latest submission for this round or initialize one
    let submission = await VoteSubmission.findOne({
      stageId: stage._id,
      sourceId: source._id,
      ...roundQuery,
      isLatestRevision: true,
    }).sort({ revision: -1, createdAt: -1 });

    const candidateListIds =
      stage.stageType === 'STAGE_2' &&
      targetRound === 2 &&
      stage.round2CandidateIds &&
      stage.round2CandidateIds.length > 0
        ? stage.round2CandidateIds
        : stage.candidateIds;

    const stageCandidates = await Candidate.find({ _id: { $in: candidateListIds } });

    if (!submission) {
      const initialVotes = stageCandidates.map((c) => ({
        candidateId: c._id,
        candidateNumber: c.candidateNumber,
        count: 0,
      }));

      submission = new VoteSubmission({
        electionId: stage.electionId,
        stageId: stage._id,
        sourceId: source._id,
        round: targetRound,
        votes: initialVotes,
        invalidVotes: 0,
        totalVotes: 0,
        revision: 1,
        isLatestRevision: true,
        isFinalSaved: false,
        verificationStatus: 'VERIFIED',
        submittedBy: req.user?.id,
        verifiedBy: req.user?.id,
        verifiedAt: new Date(),
        notes: `Live Tally Mode (Penghitungan Putaran ${targetRound})`,
      });
    } else {
      submission.round = targetRound;
      // Ensure all candidates for this round exist in submission.votes
      for (const cand of stageCandidates) {
        const hasCand = submission.votes.some(
          (v) => v.candidateId.toString() === cand._id.toString()
        );
        if (!hasCand) {
          submission.votes.push({
            candidateId: cand._id,
            candidateNumber: cand.candidateNumber,
            count: 0,
          });
        }
      }
    }

    // Apply incremental or bulk update
    if (Array.isArray(votes)) {
      submission.votes = votes.map((v: any) => ({
        candidateId: new mongoose.Types.ObjectId(v.candidateId),
        candidateNumber: v.candidateNumber,
        count: Math.max(0, Number(v.count) || 0),
      }));
      if (invalidVotes !== undefined) {
        submission.invalidVotes = Math.max(0, Number(invalidVotes) || 0);
      }
    } else if (isInvalidVote) {
      submission.invalidVotes = Math.max(0, submission.invalidVotes + Number(delta));
    } else if (candidateId) {
      const targetVote = submission.votes.find(
        (v) => v.candidateId.toString() === candidateId.toString()
      );
      if (targetVote) {
        targetVote.count = Math.max(0, targetVote.count + Number(delta));
      } else {
        const cand = await Candidate.findById(candidateId);
        if (cand) {
          submission.votes.push({
            candidateId: cand._id,
            candidateNumber: cand.candidateNumber,
            count: Math.max(0, Number(delta)),
          });
        }
      }
    }

    // Recalculate total votes
    const sumValid = submission.votes.reduce((acc, curr) => acc + curr.count, 0);
    submission.totalVotes = sumValid + submission.invalidVotes;
    submission.verifiedAt = new Date();
    await submission.save();

    // Ensure source status is verified
    source.status = 'VERIFIED';
    source.activeSubmissionId = submission._id as any;
    await source.save();

    // Invalidate cache & recalculate quickcount freshly
    QuickCountService.invalidateCache(stage._id.toString());
    const quickcountData = await QuickCountService.calculateStageQuickCount(
      stage._id.toString(),
      true,
      targetRound
    );

    // Broadcast instant WebSocket update
    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData,
      leaderChanged: quickcountData.leaderChanged,
      message: `Suara langsung diperbarui (${submission.totalVotes} suara)`,
    });

    res.status(200).json({
      success: true,
      message: `Live tally berhasil (${submission.totalVotes} suara)`,
      submission,
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
