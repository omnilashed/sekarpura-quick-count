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

export interface QuickCountResult {
  electionId: string;
  stageId: string;
  stageType: string;
  stageName: string;
  stageStatus: string;
  totalVotesIn: number;
  validVotes: number;
  invalidVotes: number;
  targetSourcesCount: number;
  completedSourcesCount: number;
  progressPercentage: number;
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
      quickCountCache.delete(stageId);
    } else {
      quickCountCache.clear();
    }
  }

  static async calculateStageQuickCount(
    stageId: string,
    bypassCache = false
  ): Promise<QuickCountResult> {
    if (!bypassCache) {
      const cached = quickCountCache.get(stageId);
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }
    }

    const stage = await ElectionStage.findById(stageId);
    if (!stage) {
      throw new Error('Tahap pemilihan tidak ditemukan.');
    }

    // Load candidates registered in this stage
    const candidates = await Candidate.find({ _id: { $in: stage.candidateIds } })
      .sort({ candidateNumber: 1 })
      .lean();

    // Get all verified, latest submissions for this stage
    const submissions = await VoteSubmission.find({
      stageId: new mongoose.Types.ObjectId(stageId),
      verificationStatus: 'VERIFIED',
      isLatestRevision: true,
    })
      .populate('sourceId', 'sourceCode sourceName workUnit location')
      .sort({ verifiedAt: 1, createdAt: 1 })
      .lean();

    // Get vote sources count
    const totalSources = await VoteSource.countDocuments({ stageId: stage._id });
    const completedSources = submissions.length;

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

    const totalVotesIn = validVotes + invalidVotes;

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
        profilePhoto: cand.profilePhoto,
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
      totalSources > 0 ? Number(((completedSources / totalSources) * 100).toFixed(1)) : 0;

    const result: QuickCountResult = {
      electionId: stage.electionId.toString(),
      stageId: stage._id.toString(),
      stageType: stage.stageType,
      stageName: stage.name,
      stageStatus: stage.status,
      totalVotesIn,
      validVotes,
      invalidVotes,
      targetSourcesCount: totalSources,
      completedSourcesCount: completedSources,
      progressPercentage,
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
      timeline,
      recentActivities,
      lastUpdatedAt: new Date(),
    };

    // Simpan ke in-memory micro-cache
    quickCountCache.set(stageId, { data: result, expiry: Date.now() + CACHE_TTL_MS });

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
