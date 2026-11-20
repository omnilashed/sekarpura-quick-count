import { Request, Response } from 'express';
import { Election, ElectionOverallStatus } from '../models/Election.js';
import { ElectionStage } from '../models/ElectionStage.js';
import { Candidate } from '../models/Candidate.js';
import { VoteSource } from '../models/VoteSource.js';
import { AuthRequest } from '../middlewares/auth.js';
import { AuditService } from '../services/audit.service.js';
import { broadcastStageChanged, broadcastQuickCountUpdate } from '../config/socket.js';
import { QuickCountService } from '../services/quickcount.service.js';
import { promoteCandidatesSchema, updateStageStatusSchema } from '../validations/schemas.js';

export class ElectionController {
  /**
   * Get current election overview
   */
  static async getElection(_req: Request, res: Response): Promise<void> {
    let election = await Election.findOne().populate('activeStageId');
    if (!election) {
      // Default election if not seeded yet
      election = await Election.create({
        title: 'Pemilihan Ketua SEKARPURA Cabang Halim Perdanakusuma',
        description: 'Musyawarah & Pemilihan Ketua Serikat Pekerja Angkasa Pura Indonesia Cabang Halim Perdanakusuma Periode 2026-2029',
        branch: 'Halim Perdanakusuma',
        electionYear: 2026,
        currentStage: 'STAGE_1',
        status: 'PRELIMINARY_COUNTING',
      });
    }

    const stages = await ElectionStage.find({ electionId: election._id })
      .populate('candidateIds', 'fullName nickname candidateNumber position workUnit profilePhoto candidacyStatus')
      .sort({ stageType: 1 });

    res.status(200).json({
      success: true,
      data: {
        election,
        stages,
      },
    });
  }

  /**
   * Get all election stages
   */
  static async getStages(req: Request, res: Response): Promise<void> {
    const election = await Election.findOne();
    if (!election) {
      res.status(404).json({ success: false, message: 'Pemilihan belum diinisialisasi.' });
      return;
    }

    const stages = await ElectionStage.find({ electionId: election._id })
      .populate('candidateIds', 'fullName nickname candidateNumber position workUnit profilePhoto candidacyStatus stage1Qualified stage2Qualified')
      .sort({ stageType: 1 });

    res.status(200).json({
      success: true,
      data: stages,
    });
  }

  /**
   * Admin: Transition Election Status
   */
  static async updateElectionStatus(req: AuthRequest, res: Response): Promise<void> {
    const { status, currentStage, notes } = req.body;

    const election = await Election.findOne();
    if (!election) {
      res.status(404).json({ success: false, message: 'Pemilihan tidak ditemukan.' });
      return;
    }

    const beforeStatus = election.status;
    election.status = status as ElectionOverallStatus;
    if (currentStage) {
      election.currentStage = currentStage;
    }

    // Set active stage pointer according to currentStage
    const matchingStage = await ElectionStage.findOne({
      electionId: election._id,
      stageType: election.currentStage,
    });
    if (matchingStage) {
      election.activeStageId = matchingStage._id as any;
    }

    await election.save();

    // Broadcast change
    broadcastStageChanged({
      electionId: election._id.toString(),
      stageId: matchingStage ? matchingStage._id.toString() : '',
      newStatus: election.status,
      stageType: election.currentStage,
      stage: matchingStage,
    });

    // Audit log
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'ELECTION_STATUS_TRANSITION',
      entityType: 'Election',
      entityId: election._id.toString(),
      before: { status: beforeStatus },
      after: { status: election.status, currentStage: election.currentStage },
      reason: notes || `Perubahan tahapan pemilihan menjadi ${election.status}`,
    });

    res.status(200).json({
      success: true,
      message: `Status pemilihan berhasil diperbarui ke ${election.status}.`,
      data: election,
    });
  }

  /**
   * Admin: Update stage status (COUNTING, COMPLETED, LOCKED)
   */
  static async updateStageStatus(req: AuthRequest, res: Response): Promise<void> {
    const { stageId } = req.params;
    const validated = updateStageStatusSchema.parse(req.body);

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    const beforeStatus = stage.status;
    stage.status = validated.status;

    if (validated.status === 'COMPLETED' || validated.status === 'LOCKED') {
      stage.finalizedAt = new Date();
      stage.finalizedBy = req.user?.id as any;
    }

    await stage.save();

    // Also update overall election status accordingly
    const election = await Election.findById(stage.electionId);
    if (election) {
      if (stage.stageType === 'STAGE_1' && validated.status === 'COMPLETED') {
        election.status = 'PRELIMINARY_COMPLETED';
      } else if (stage.stageType === 'STAGE_2' && validated.status === 'COMPLETED') {
        election.status = 'FINAL_COMPLETED';
        election.completedAt = new Date();
      }
      await election.save();
    }

    // Broadcast
    broadcastStageChanged({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      newStatus: stage.status,
      stageType: stage.stageType,
      stage,
    });

    // Record audit
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'STAGE_STATUS_CHANGED',
      entityType: 'ElectionStage',
      entityId: stage._id.toString(),
      before: { status: beforeStatus },
      after: { status: stage.status },
      reason: validated.notes || `Penetapan status tahap menjadi ${stage.status}`,
    });

    res.status(200).json({
      success: true,
      message: `Status tahap berhasil diubah menjadi ${stage.status}.`,
      data: stage,
    });
  }

  /**
   * Admin: Promote Bakal Calon to Calon Definitif (Stage 2)
   */
  static async promoteCandidatesToStage2(req: AuthRequest, res: Response): Promise<void> {
    const validated = promoteCandidatesSchema.parse(req.body);
    const { candidateIds, notes } = validated;

    const election = await Election.findOne();
    if (!election) {
      res.status(404).json({ success: false, message: 'Pemilihan tidak ditemukan.' });
      return;
    }

    // Update candidates' candidacyStatus and stage2Qualified flag
    // Disqualify or mark candidates not in list
    await Candidate.updateMany(
      { _id: { $in: candidateIds } },
      {
        $set: {
          stage2Qualified: true,
          candidacyStatus: 'CALON_TETAP',
        },
      }
    );

    // Candidates not in list remain BAKAL_CALON but stage2Qualified: false
    await Candidate.updateMany(
      { _id: { $nin: candidateIds } },
      {
        $set: {
          stage2Qualified: false,
        },
      }
    );

    // Find or create Stage 2
    let stage2 = await ElectionStage.findOne({
      electionId: election._id,
      stageType: 'STAGE_2',
    });

    if (!stage2) {
      stage2 = new ElectionStage({
        electionId: election._id,
        stageType: 'STAGE_2',
        name: 'Tahap 2 - Pemilihan Calon Ketua Definitif',
        description: 'Pemilihan final calon ketua definitif hasil penjaringan tahap 1',
        candidateIds,
        status: 'COUNTING',
        startedAt: new Date(),
      });
      await stage2.save();
    } else {
      stage2.candidateIds = candidateIds as any;
      stage2.status = 'COUNTING';
      await stage2.save();
    }

    // Mark Stage 1 as COMPLETED when advancing to Stage 2
    const stage1 = await ElectionStage.findOne({ electionId: election._id, stageType: 'STAGE_1' });
    if (stage1 && stage1.status !== 'COMPLETED') {
      stage1.status = 'COMPLETED';
      stage1.endedAt = new Date();
      await stage1.save();
    }

    // Replicate / create clean Vote Sources for Stage 2 if not existing
    if (stage1) {
      const existingSourcesStage2 = await VoteSource.countDocuments({ stageId: stage2._id });
      if (existingSourcesStage2 === 0) {
        const stage1Sources = await VoteSource.find({ stageId: stage1._id });
        const newSources = stage1Sources.map((s) => {
          let newName = s.sourceName
            .replace(/Tahap 1/gi, 'Tahap 2')
            .replace(/Penjaringan Bakal Calon/gi, 'Pemilihan Calon Definitif');
          if (newName === s.sourceName) {
            newName = `${s.sourceName} (Tahap 2)`;
          }
          return {
            electionId: election._id,
            stageId: stage2!._id,
            sourceCode: s.sourceCode,
            sourceName: newName,
            workUnit: s.workUnit,
            location: s.location,
            targetVoters: s.targetVoters,
            status: 'NOT_SUBMITTED',
          };
        });
        if (newSources.length > 0) {
          await VoteSource.insertMany(newSources);
        }
      }
    }

    // Switch election pointer to Stage 2
    election.currentStage = 'STAGE_2';
    election.status = 'FINAL_COUNTING';
    election.activeStageId = stage2._id as any;
    await election.save();

    // Broadcast stage changed
    broadcastStageChanged({
      electionId: election._id.toString(),
      stageId: stage2._id.toString(),
      newStatus: election.status,
      stageType: 'STAGE_2',
      stage: stage2,
    });

    // Record audit
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'STAGE_2_PROMOTION',
      entityType: 'ElectionStage',
      entityId: stage2._id.toString(),
      after: {
        qualifiedCandidatesCount: candidateIds.length,
        candidateIds,
      },
      reason: notes || 'Penetapan calon ketua definitif lolos tahap 2 dan pembukaan quickcount tahap 2',
    });

    res.status(200).json({
      success: true,
      message: `${candidateIds.length} calon ketua berhasil ditetapkan lolos ke Tahap 2. QuickCount Tahap 2 siap dimulai.`,
      stage2,
    });
  }

  /**
   * Admin/GM: Cast 1 decisive vote by General Manager Bandara Halim PK in Stage 2 (50%-50% tie-breaker)
   */
  static async castGmTieBreaker(req: AuthRequest, res: Response): Promise<void> {
    const { stageId } = req.params;
    const { candidateId, notes } = req.body;

    if (!candidateId) {
      res.status(400).json({ success: false, message: 'Kandidat penerima suara penentu GM Halim wajib dipilih.' });
      return;
    }

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    if (stage.stageType !== 'STAGE_2') {
      res.status(400).json({
        success: false,
        message: 'Hak 1 suara penentu GM Bandara Halim PK hanya berlaku untuk Pemilihan Definitif Tahap 2.',
      });
      return;
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
      return;
    }

    stage.isTieBreakerActive = true;
    stage.tieBreakerRole = 'General Manager Bandara Halim Perdanakusuma';
    stage.tieBreakerCandidateId = candidate._id as any;
    stage.tieBreakerVotedAt = new Date();
    stage.tieBreakerNotes = notes || 'Suara Penentu oleh General Manager Bandara Halim PK untuk menentukan Ketua Definitif';
    await stage.save();

    // Invalidate quick count cache and recalculate
    QuickCountService.invalidateCache(stageId);
    const qcData = await QuickCountService.calculateStageQuickCount(stageId, true);

    // Broadcast live to all connected screens
    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData: qcData,
      leaderChanged: qcData.leaderChanged,
    });

    // Record audit trail
    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'General Manager Bandara Halim PK',
      actorRole: req.user?.role || 'SUPER_ADMIN',
      action: 'GM_TIE_BREAKER_VOTE',
      entityType: 'ElectionStage',
      entityId: stage._id.toString(),
      after: {
        candidateId,
        candidateName: candidate.fullName,
        notes: stage.tieBreakerNotes,
      },
      reason: `Pemberian 1 suara penentu oleh General Manager Bandara Halim PK kepada ${candidate.fullName}`,
    });

    res.status(200).json({
      success: true,
      message: `1 Suara Penentu General Manager Bandara Halim PK berhasil diberikan kepada ${candidate.fullName}.`,
      quickCount: qcData,
    });
  }

  /**
   * Admin/GM: Reset/Cancel GM Tie-Breaker Vote in Stage 2
   */
  static async resetGmTieBreaker(req: AuthRequest, res: Response): Promise<void> {
    const { stageId } = req.params;

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      res.status(404).json({ success: false, message: 'Tahap pemilihan tidak ditemukan.' });
      return;
    }

    stage.isTieBreakerActive = false;
    stage.tieBreakerCandidateId = undefined;
    stage.tieBreakerVotedAt = undefined;
    stage.tieBreakerNotes = undefined;
    await stage.save();

    QuickCountService.invalidateCache(stageId);
    const qcData = await QuickCountService.calculateStageQuickCount(stageId, true);

    broadcastQuickCountUpdate({
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      quickcountData: qcData,
      leaderChanged: qcData.leaderChanged,
    });

    await AuditService.record({
      actorId: req.user?.id,
      actorName: req.user?.name || 'Admin',
      actorRole: req.user?.role || 'ADMIN',
      action: 'GM_TIE_BREAKER_RESET',
      entityType: 'ElectionStage',
      entityId: stage._id.toString(),
      reason: 'Pembatalan suara penentu GM Bandara Halim PK',
    });

    res.status(200).json({
      success: true,
      message: 'Suara penentu GM Bandara Halim PK berhasil direset.',
      quickCount: qcData,
    });
  }
}
