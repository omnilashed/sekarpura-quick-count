import mongoose from 'mongoose';
import { ElectionStage, IElectionStage } from '../models/ElectionStage.js';
import { VoteSubmission } from '../models/VoteSubmission.js';
import { Candidate, ICandidate } from '../models/Candidate.js';
import { VoteSource } from '../models/VoteSource.js';
import { Election } from '../models/Election.js';

export interface CandidateRanking {
  candidateId: string;
  candidateNumber: number;
  fullName: string;
  nickname: string;
  position: string;
  workUnit: string;
  department: string;
  profilePhoto?: string;
  votes: number;
  percentage: number;
  rank: number;
  diffFromLeader: number;
  isLeader: boolean;
  isTied: boolean;
}

export interface StageSchemaRules {
  stageType: 'STAGE_1' | 'STAGE_2';
  targetVotes: number;
  remainingVotes: number;
  activeRound: number;
  currentRound: number;
  round1Completed: boolean;
  round2Completed: boolean;
  isRound1Saved?: boolean;
  isRound2Saved?: boolean;
  isCurrentRoundSaved?: boolean;
  round1Summary?: {
    totalVotesIn: number;
    validVotes: number;
    invalidVotes: number;
    threshold50Plus1: number;
    hasWinner50Plus1: boolean;
    winnerCandidateId?: string;
    winnerName?: string;
    top2Candidates: Array<{
      candidateId: string;
      candidateNumber: number;
      fullName: string;
      votes: number;
    }>;
    rankings: Array<{
      candidateId: string;
      candidateNumber: number;
      fullName: string;
      votes: number;
    }>;
  };
  // Alur 2 Skema Pemilihan Ketua Definitif (Tahap 2)
  stage2Definitive: {
    activeSchema: 'SKEMA_1' | 'SKEMA_2';
    threshold50Plus1: number;
    // Skema 1: Menang jika menerima >= 50% + 1 dari total suara. Jika tidak terpenuhi, diambil 2 calon ke Skema 2
    skema1: {
      thresholdVotes: number;
      hasWinner50Plus1: boolean;
      winnerCandidateId?: string;
      winnerName?: string;
      isFulfilled: boolean;
      top2CandidateIds: string[];
      top2CandidateNames: string[];
    };
    // Skema 2: Putaran Head-to-Head 2 Calon. Jika suara 50% : 50%, otomatis tambah 1 suara penentu GM Halim PK
    skema2: {
      isActive: boolean;
      is5050Tie: boolean;
      requiresGmTieBreaker: boolean;
      gmRoleName: string;
      gmTieBreakerCast: boolean;
      gmTieBreakerCandidateId?: string;
      gmTieBreakerCandidateName?: string;
      gmTieBreakerVotedAt?: Date;
      definitiveWinnerId?: string;
      definitiveWinnerName?: string;
    };
  };
  // Backward-compatible properties
  stage1: {
    threshold50Plus1: number;
    hasWinner50Plus1: boolean;
    winnerCandidateId?: string;
    winnerName?: string;
    advancingCount: number; // 2
    top2CandidateIds: string[];
    top2CandidateNames: string[];
  };
  stage2: {
    is5050Tie: boolean;
    requiresGmTieBreaker: boolean;
    gmRoleName: string;
    gmTieBreakerCast: boolean;
    gmTieBreakerCandidateId?: string;
    gmTieBreakerCandidateName?: string;
    gmTieBreakerVotedAt?: Date;
    definitiveWinnerId?: string;
    definitiveWinnerName?: string;
  };
  // Direct aliases for convenience
  skema1?: {
    thresholdVotes?: number;
    threshold50Plus1?: number;
    hasWinner50Plus1?: boolean;
    winnerCandidateId?: string;
    winnerName?: string;
    isFulfilled?: boolean;
    top2CandidateIds?: string[];
    top2CandidateNames?: string[];
  };
  skema2?: {
    isActive?: boolean;
    is5050Tie?: boolean;
    requiresGmTieBreaker?: boolean;
    gmRoleName?: string;
    gmTieBreakerCast?: boolean;
    gmTieBreakerCandidateId?: string;
    gmTieBreakerCandidateName?: string;
    gmTieBreakerVotedAt?: Date;
    definitiveWinnerCandidateId?: string;
    definitiveWinnerName?: string;
    tieBreakerNotes?: string;
  };
}

export interface QuickCountResult {
  electionId: string;
  stageId: string;
  stageType: string;
  stageName: string;
  stageStatus: string;
  totalEligibleVoters: number;
  targetVotes: number;
  totalVotesIn: number;
  validVotes: number;
  invalidVotes: number;
  targetSourcesCount: number;
  completedSourcesCount: number;
  progressPercentage: number;
  activeRound: number;
  currentRound: number;
  round1Completed: boolean;
  round2Completed: boolean;
  isRound1Saved?: boolean;
  isRound2Saved?: boolean;
  isCurrentRoundSaved?: boolean;
  rankings: CandidateRanking[];
  top5: CandidateRanking[];
  leaderChanged: boolean;
  previousLeaderId?: string;
  currentLeaderId?: string;
  sourcesStatus: {
    total: number;
    completed: number;
    pending: number;
  };
  schemaRules: StageSchemaRules;
  timeline: Array<{
    timestamp: string;
    totalVotes: number;
    sourceCode: string;
    sourceName: string;
    [candidateId: string]: any;
  }>;
  recentActivities: Array<{
    id: string;
    sourceCode: string;
    sourceName: string;
    workUnit: string;
    totalVotes: number;
    verifiedAt: Date;
    revision: number;
  }>;
  lastUpdatedAt: Date;
}

// In-memory previous leader cache to detect leader changes across broadcasts
const previousLeaderMap = new Map<string, string>();

// In-memory micro-cache untuk operasi pembacaan massal (High-Traffic Protection: 2.5s TTL)
// Mencegah query beruntun ke database saat ribuan orang membuka/me-refresh beranda secara bersamaan
const quickCountCache = new Map<string, { data: QuickCountResult; expiry: number }>();
const CACHE_TTL_MS = 2500;

export class QuickCountService {
  /**
   * Menghapus cache saat ada data suara baru yang masuk atau dikoreksi
   */
  static invalidateCache(stageId?: string): void {
    if (stageId) {
      for (const key of quickCountCache.keys()) {
        if (key === stageId || key.startsWith(`${stageId}_`)) {
          quickCountCache.delete(key);
        }
      }
    } else {
      quickCountCache.clear();
    }
  }

  static async calculateStageQuickCount(
    stageId: string,
    bypassCache = false,
    requestedRound?: number
  ): Promise<QuickCountResult> {
    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      throw new Error('Tahap pemilihan tidak ditemukan.');
    }

    const effectiveRound =
      requestedRound !== undefined ? Number(requestedRound) : (stage.activeRound || 1);
    const cacheKey = `${stageId}_round_${effectiveRound}`;

    if (!bypassCache) {
      const cached = quickCountCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }
    }

    // Tentukan kandidat yang bertanding pada putaran ini
    const candidateIdsToLoad =
      stage.stageType === 'STAGE_2' &&
      effectiveRound === 2 &&
      stage.round2CandidateIds &&
      stage.round2CandidateIds.length > 0
        ? stage.round2CandidateIds
        : stage.candidateIds;

    // Load candidates registered in this stage / round
    const candidates = await Candidate.find({ _id: { $in: candidateIdsToLoad } })
      .sort({ candidateNumber: 1 })
      .lean();

    // Query filter untuk submission sesuai putaran (Round 1 fallback ke legacy submission tanpa field round)
    const submissionFilter: any = {
      stageId: new mongoose.Types.ObjectId(stageId),
      verificationStatus: 'VERIFIED',
      isLatestRevision: true,
    };
    if (effectiveRound === 1) {
      submissionFilter.$or = [{ round: 1 }, { round: { $exists: false } }];
    } else {
      submissionFilter.round = effectiveRound;
    }

    // Get all verified, latest submissions for this stage and round
    const submissions = await VoteSubmission.find(submissionFilter)
      .populate('sourceId', 'sourceCode sourceName workUnit location')
      .sort({ verifiedAt: 1, createdAt: 1 })
      .lean();

    // Ambil data seluruh TPS / sumber suara pada tahap ini
    const sources = await VoteSource.find({ stageId: stage._id }).lean();
    const totalSources = sources.length;
    const completedSources = submissions.length;

    // Target votes determination: prioritaskan jumlah total targetVoters dari seluruh TPS / Sumber Suara
    const sourcesTargetSum = sources.reduce((sum, s) => sum + (s.targetVoters || 0), 0);
    const baseTarget =
      sourcesTargetSum > 0
        ? sourcesTargetSum
        : stage.targetVotes && stage.targetVotes > 0
        ? stage.targetVotes
        : stage.stageType === 'STAGE_2'
        ? 24
        : stage.totalEligibleVoters || 102;

    // Aggregate votes per candidate
    const voteCountMap = new Map<string, number>();
    candidates.forEach((c) => voteCountMap.set(c._id.toString(), 0));

    let validVotes = 0;
    let invalidVotes = 0;

    // Build timeline progression
    const timeline: QuickCountResult['timeline'] = [];
    let cumulativeVotes = 0;

    for (const sub of submissions) {
      invalidVotes += sub.invalidVotes || 0;
      let subValid = 0;

      const timeEntry: any = {
        timestamp: (sub.verifiedAt || sub.createdAt).toISOString(),
        sourceCode: (sub.sourceId as any)?.sourceCode || 'TPS',
        sourceName: (sub.sourceId as any)?.sourceName || 'TPS',
      };

      for (const v of sub.votes) {
        const cId = v.candidateId.toString();
        const currentTotal = voteCountMap.get(cId) || 0;
        const newTotal = currentTotal + v.count;
        voteCountMap.set(cId, newTotal);
        subValid += v.count;
        timeEntry[cId] = newTotal;
      }

      validVotes += subValid;
      cumulativeVotes += sub.totalVotes;
      timeEntry.totalVotes = cumulativeVotes;
      timeline.push(timeEntry);
    }

    // Apply GM Halim Tie-Breaker Vote in Stage 2 if active (+1 decisive vote)
    let gmTieBreakerApplied = false;
    if (
      stage.stageType === 'STAGE_2' &&
      stage.isTieBreakerActive &&
      stage.tieBreakerCandidateId
    ) {
      const cId = stage.tieBreakerCandidateId.toString();
      if (voteCountMap.has(cId)) {
        voteCountMap.set(cId, (voteCountMap.get(cId) || 0) + 1);
        validVotes += 1;
        gmTieBreakerApplied = true;
      }
    }

    const totalVotesIn = validVotes + invalidVotes;
    const targetVotes = gmTieBreakerApplied ? Math.max(baseTarget, totalVotesIn) : baseTarget;

    // Build rankings with deterministic tie-breaking (votes DESC, then candidateNumber ASC)
    const rawRankings = candidates.map((cand) => {
      const votes = voteCountMap.get(cand._id.toString()) || 0;
      const percentage = validVotes > 0 ? Number(((votes / validVotes) * 100).toFixed(2)) : 0;
      return {
        candidateId: cand._id.toString(),
        candidateNumber: cand.candidateNumber,
        fullName: cand.fullName,
        nickname: cand.nickname,
        position: cand.position,
        workUnit: cand.workUnit,
        department: cand.department,
        profilePhoto:
          cand.photoGridFSId ||
          (cand.profilePhoto && cand.profilePhoto.startsWith('/uploads/photos/candidate-'))
            ? `/api/candidates/${cand._id}/photo`
            : cand.profilePhoto,
        votes,
        percentage,
      };
    });

    // Sort by votes DESC, then candidateNumber ASC
    rawRankings.sort((a, b) => {
      if (b.votes !== a.votes) {
        return b.votes - a.votes;
      }
      return a.candidateNumber - b.candidateNumber;
    });

    const leaderVotes = rawRankings[0]?.votes || 0;

    // Assign rank and check for ties
    const rankings: CandidateRanking[] = rawRankings.map((c, index) => {
      const isLeader = index === 0 && c.votes > 0;
      const diffFromLeader = isLeader ? 0 : leaderVotes - c.votes;
      // Check if tied with previous or next candidate
      const isTied =
        (index > 0 && rawRankings[index - 1].votes === c.votes) ||
        (index < rawRankings.length - 1 && rawRankings[index + 1].votes === c.votes);

      return {
        ...c,
        rank: index + 1,
        diffFromLeader,
        isLeader,
        isTied,
      };
    });

    const top5 = rankings.slice(0, 5);

    // 2-Schema Definitive Election Calculations for Stage 2 (Pemilihan Calon Ketua Definitif)
    const thresholdStage2 = targetVotes > 0 ? Math.floor(targetVotes / 2) + 1 : 13;
    const stage2LeaderVotes = rawRankings[0]?.votes || 0;
    const hasWinner50Plus1 = stage2LeaderVotes >= thresholdStage2 && stage2LeaderVotes > 0;
    const top2Candidates = rawRankings.slice(0, 2);
    const isSkema1Fulfilled = hasWinner50Plus1;

    let is5050Tie = false;
    let requiresGmTieBreaker = false;
    let definitiveWinnerId: string | undefined = undefined;
    let definitiveWinnerName: string | undefined = undefined;

    if (stage.stageType === 'STAGE_2') {
      if (hasWinner50Plus1) {
        // Skema 1 Winner directly elected by 50% + 1
        definitiveWinnerId = rawRankings[0].candidateId;
        definitiveWinnerName = rawRankings[0].fullName;
      } else {
        // Skema 2: Head-to-Head between top 2 candidates if Skema 1 not fulfilled
        if (rawRankings.length >= 2) {
          const top1 = rawRankings[0];
          const top2 = rawRankings[1];
          if (top1.votes > 0 && top1.votes === top2.votes) {
            is5050Tie = true;
            if (!gmTieBreakerApplied) {
              requiresGmTieBreaker = true;
            }
          } else if (top1.votes > top2.votes) {
            definitiveWinnerId = top1.candidateId;
            definitiveWinnerName = top1.fullName;
          }
        }
      }

      // If GM Tie-breaker was cast, determine definitive winner
      if (gmTieBreakerApplied && stage.tieBreakerCandidateId) {
        definitiveWinnerId = stage.tieBreakerCandidateId.toString();
        const candObj = candidates.find(
          (c) => c._id.toString() === stage.tieBreakerCandidateId?.toString()
        );
        definitiveWinnerName = candObj ? candObj.fullName : undefined;
      }
    }

    const remainingVotes = Math.max(0, targetVotes - totalVotesIn);

    // Ambil ringkasan Putaran 1 secara otomatis jika pada Tahap 2 untuk riwayat / perbandingan
    let round1Summary: any = undefined;
    if (stage.stageType === 'STAGE_2') {
      const r1Submissions = await VoteSubmission.find({
        stageId: stage._id,
        verificationStatus: 'VERIFIED',
        isLatestRevision: true,
        $or: [{ round: 1 }, { round: { $exists: false } }],
      }).lean();

      if (r1Submissions.length > 0) {
        const r1Map = new Map<string, number>();
        let r1Valid = 0;
        let r1Invalid = 0;
        const allDefCandidates = await Candidate.find({ _id: { $in: stage.candidateIds } }).lean();
        allDefCandidates.forEach((c) => r1Map.set(c._id.toString(), 0));

        for (const sub of r1Submissions) {
          r1Invalid += sub.invalidVotes || 0;
          for (const v of sub.votes) {
            const id = v.candidateId.toString();
            r1Map.set(id, (r1Map.get(id) || 0) + v.count);
            r1Valid += v.count;
          }
        }
        const r1Rankings = allDefCandidates
          .map((c) => ({
            candidateId: c._id.toString(),
            candidateNumber: c.candidateNumber,
            fullName: c.fullName,
            votes: r1Map.get(c._id.toString()) || 0,
          }))
          .sort((a, b) => b.votes - a.votes);

        const r1Threshold = Math.floor(baseTarget / 2) + 1;
        round1Summary = {
          totalVotesIn: r1Valid + r1Invalid,
          validVotes: r1Valid,
          invalidVotes: r1Invalid,
          threshold50Plus1: r1Threshold,
          hasWinner50Plus1: (r1Rankings[0]?.votes || 0) >= r1Threshold && (r1Rankings[0]?.votes || 0) > 0,
          winnerCandidateId:
            (r1Rankings[0]?.votes || 0) >= r1Threshold ? r1Rankings[0]?.candidateId : undefined,
          winnerName:
            (r1Rankings[0]?.votes || 0) >= r1Threshold ? r1Rankings[0]?.fullName : undefined,
          top2Candidates: r1Rankings.slice(0, 2),
          rankings: r1Rankings,
        };
      }
    }

    // Cek apakah data pada putaran ini sudah di-save secara resmi
    const isCurrentRoundSaved = submissions.some((s) => s.isFinalSaved === true);

    const r1FinalSavedSub = await VoteSubmission.findOne({
      stageId: stage._id,
      verificationStatus: 'VERIFIED',
      isLatestRevision: true,
      isFinalSaved: true,
      $or: [{ round: 1 }, { round: { $exists: false } }],
    });
    const isRound1Saved = Boolean(r1FinalSavedSub);

    const r2FinalSavedSub = await VoteSubmission.findOne({
      stageId: stage._id,
      verificationStatus: 'VERIFIED',
      isLatestRevision: true,
      isFinalSaved: true,
      round: 2,
    });
    const isRound2Saved = Boolean(r2FinalSavedSub);

    const schemaRules: StageSchemaRules = {
      stageType: stage.stageType,
      targetVotes,
      remainingVotes,
      activeRound: stage.activeRound || 1,
      currentRound: effectiveRound,
      round1Completed: stage.round1Completed || false,
      round2Completed: stage.round2Completed || false,
      isRound1Saved,
      isRound2Saved,
      isCurrentRoundSaved,
      round1Summary,
      stage2Definitive: {
        activeSchema: effectiveRound === 1 ? 'SKEMA_1' : 'SKEMA_2',
        threshold50Plus1: thresholdStage2,
        skema1: {
          thresholdVotes: thresholdStage2,
          hasWinner50Plus1,
          winnerCandidateId: hasWinner50Plus1 ? rawRankings[0]?.candidateId : undefined,
          winnerName: hasWinner50Plus1 ? rawRankings[0]?.fullName : undefined,
          isFulfilled: isSkema1Fulfilled,
          top2CandidateIds: top2Candidates.map((c) => c.candidateId),
          top2CandidateNames: top2Candidates.map((c) => c.fullName),
        },
        skema2: {
          isActive: effectiveRound === 2,
          is5050Tie,
          requiresGmTieBreaker,
          gmRoleName: stage.tieBreakerRole || 'General Manager Bandara Halim Perdanakusuma',
          gmTieBreakerCast: gmTieBreakerApplied,
          gmTieBreakerCandidateId: stage.tieBreakerCandidateId?.toString(),
          gmTieBreakerCandidateName: stage.tieBreakerCandidateId
            ? candidates.find((c) => c._id.toString() === stage.tieBreakerCandidateId?.toString())?.fullName
            : undefined,
          gmTieBreakerVotedAt: stage.tieBreakerVotedAt,
          definitiveWinnerId,
          definitiveWinnerName,
        },
      },
      stage1: {
        threshold50Plus1: thresholdStage2,
        hasWinner50Plus1,
        winnerCandidateId: hasWinner50Plus1 ? rawRankings[0]?.candidateId : undefined,
        winnerName: hasWinner50Plus1 ? rawRankings[0]?.fullName : undefined,
        advancingCount: 2,
        top2CandidateIds: top2Candidates.map((c) => c.candidateId),
        top2CandidateNames: top2Candidates.map((c) => c.fullName),
      },
      stage2: {
        is5050Tie,
        requiresGmTieBreaker,
        gmRoleName: stage.tieBreakerRole || 'General Manager Bandara Halim Perdanakusuma',
        gmTieBreakerCast: gmTieBreakerApplied,
        gmTieBreakerCandidateId: stage.tieBreakerCandidateId?.toString(),
        gmTieBreakerCandidateName: stage.tieBreakerCandidateId
          ? candidates.find((c) => c._id.toString() === stage.tieBreakerCandidateId?.toString())?.fullName
          : undefined,
        gmTieBreakerVotedAt: stage.tieBreakerVotedAt,
        definitiveWinnerId,
        definitiveWinnerName,
      },
      skema1: {
        thresholdVotes: thresholdStage2,
        threshold50Plus1: thresholdStage2,
        hasWinner50Plus1,
        winnerCandidateId: hasWinner50Plus1 ? rawRankings[0]?.candidateId : undefined,
        winnerName: hasWinner50Plus1 ? rawRankings[0]?.fullName : undefined,
        isFulfilled: isSkema1Fulfilled,
        top2CandidateIds: top2Candidates.map((c) => c.candidateId),
        top2CandidateNames: top2Candidates.map((c) => c.fullName),
      },
      skema2: {
        isActive: effectiveRound === 2,
        is5050Tie,
        requiresGmTieBreaker,
        gmRoleName: stage.tieBreakerRole || 'General Manager Bandara Halim Perdanakusuma',
        gmTieBreakerCast: gmTieBreakerApplied,
        gmTieBreakerCandidateId: stage.tieBreakerCandidateId?.toString(),
        gmTieBreakerCandidateName: stage.tieBreakerCandidateId
          ? candidates.find((c) => c._id.toString() === stage.tieBreakerCandidateId?.toString())?.fullName
          : undefined,
        gmTieBreakerVotedAt: stage.tieBreakerVotedAt,
        definitiveWinnerCandidateId: definitiveWinnerId,
        definitiveWinnerName,
        tieBreakerNotes: stage.tieBreakerNotes,
      },
    };

    // Leader change detection
    const currentLeader = rankings[0]?.votes > 0 ? rankings[0].candidateId : undefined;
    const prevLeader = previousLeaderMap.get(stageId);
    let leaderChanged = false;

    if (currentLeader && prevLeader && currentLeader !== prevLeader) {
      leaderChanged = true;
    }
    if (currentLeader) {
      previousLeaderMap.set(stageId, currentLeader);
    }

    // Update stage cached counts in MongoDB for fast queries
    await ElectionStage.findByIdAndUpdate(stageId, {
      totalVotesIn,
      validVotes,
      invalidVotes,
      targetSourcesCount: totalSources,
      completedSourcesCount: completedSources,
      targetVotes: baseTarget,
    });

    // Recent safe public activities
    const recentActivities = submissions
      .slice(-10)
      .reverse()
      .map((s) => ({
        id: s._id.toString(),
        sourceCode: (s.sourceId as any)?.sourceCode || 'TPS',
        sourceName: (s.sourceId as any)?.sourceName || 'Sumber Suara',
        workUnit: (s.sourceId as any)?.workUnit || '-',
        totalVotes: s.totalVotes,
        verifiedAt: s.verifiedAt || s.createdAt,
        revision: s.revision,
      }));

    const progressPercentage =
      targetVotes > 0
        ? Number(((totalVotesIn / targetVotes) * 100).toFixed(1))
        : totalSources > 0
        ? Number(((completedSources / totalSources) * 100).toFixed(1))
        : 0;

    const result: QuickCountResult = {
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      stageType: stage.stageType,
      stageName: stage.name,
      stageStatus: stage.status,
      totalEligibleVoters: stage.totalEligibleVoters || targetVotes,
      targetVotes,
      totalVotesIn,
      validVotes,
      invalidVotes,
      targetSourcesCount: totalSources,
      completedSourcesCount: completedSources,
      progressPercentage,
      activeRound: stage.activeRound || 1,
      currentRound: effectiveRound,
      round1Completed: stage.round1Completed || false,
      round2Completed: stage.round2Completed || false,
      isRound1Saved,
      isRound2Saved,
      isCurrentRoundSaved,
      rankings,
      top5,
      leaderChanged,
      previousLeaderId: prevLeader,
      currentLeaderId: currentLeader,
      sourcesStatus: {
        total: totalSources,
        completed: completedSources,
        pending: Math.max(0, totalSources - completedSources),
      },
      schemaRules,
      timeline,
      recentActivities,
      lastUpdatedAt: new Date(),
    };

    // Simpan ke in-memory micro-cache
    quickCountCache.set(cacheKey, { data: result, expiry: Date.now() + CACHE_TTL_MS });

    return result;
  }

  static async getActiveStageQuickCount(): Promise<QuickCountResult | null> {
    const election = await Election.findOne().sort({ createdAt: -1 });
    if (!election) return null;

    let stageId = election.activeStageId?.toString();
    if (!stageId) {
      // Find the currently active or counting stage
      const stage = await ElectionStage.findOne({
        electionId: election._id,
        status: { $in: ['COUNTING', 'ACTIVE', 'PENDING'] },
      }).sort({ stageType: election.currentStage === 'STAGE_2' ? -1 : 1 });

      if (stage) {
        stageId = stage._id.toString();
      } else {
        const anyStage = await ElectionStage.findOne({ electionId: election._id });
        if (anyStage) stageId = anyStage._id.toString();
      }
    }

    if (!stageId) return null;
    return this.calculateStageQuickCount(stageId);
  }
}
