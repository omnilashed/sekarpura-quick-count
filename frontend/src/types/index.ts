export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CANDIDATE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  candidateId?: string;
  candidate?: Candidate;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
}

export interface CandidateProgram {
  title: string;
  description: string;
  priority?: number;
}

export interface CandidateExperience {
  role: string;
  organization: string;
  period: string;
  description?: string;
}

export interface Candidate {
  _id: string;
  userId?: string;
  candidateNumber: number;
  fullName: string;
  nickname: string;
  position: string;
  workUnit: string;
  department: string;
  tenure?: string;
  profilePhoto?: string;
  biography?: string;
  experience: CandidateExperience[];
  leadershipExperience?: string;
  vision: string;
  mission: string[];
  programs: CandidateProgram[];
  expectations?: string;
  campaignMessage?: string;
  profileVideoUrl?: string;
  presentationId?: Presentation | string;
  candidacyStatus: 'BAKAL_CALON' | 'CALON_TETAP' | 'DISKUALIFIKASI' | 'TERPILIH';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  publicationStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rejectionReason?: string;
  willingnessStatement?: 'BERSEDIA' | 'TIDAK_BERSEDIA' | 'DISKUALIFIKASI';
  stage1Qualified: boolean;
  stage2Qualified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SlideData {
  slideNumber: number;
  title?: string;
  bullets?: string[];
  content?: string;
  imageKey?: string;
  note?: string;
}

export interface Presentation {
  _id: string;
  candidateId: any;
  title: string;
  description?: string;
  originalFileName: string;
  originalFileKey: string;
  fileType: 'pdf' | 'ppt' | 'pptx';
  fileSize: number;
  convertedFileKey?: string;
  thumbnailKeys: string[];
  slidesData: SlideData[];
  slideCount: number;
  version: number;
  conversionStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  conversionError?: string;
  publicationStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  uploadedAt: string;
}

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

export interface QuickCountData {
  electionId: string;
  stageId: string;
  stageType: 'STAGE_1' | 'STAGE_2';
  stageName: string;
  stageStatus: 'PENDING' | 'COUNTING' | 'COMPLETED' | 'LOCKED';
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
    [key: string]: any;
  }>;
  recentActivities: Array<{
    id: string;
    sourceCode: string;
    sourceName: string;
    workUnit: string;
    totalVotes: number;
    verifiedAt: string;
    revision: number;
  }>;
  lastUpdatedAt: string;
}

export interface ElectionStage {
  _id: string;
  electionId: string;
  stageType: 'STAGE_1' | 'STAGE_2';
  name: string;
  description?: string;
  candidateIds: any[];
  status: 'PENDING' | 'COUNTING' | 'COMPLETED' | 'LOCKED';
  totalEligibleVoters: number;
  totalVotesIn: number;
  validVotes: number;
  invalidVotes: number;
  targetSourcesCount: number;
  completedSourcesCount: number;
  startedAt?: string;
  endedAt?: string;
  finalizedAt?: string;
}

export interface Election {
  _id: string;
  title: string;
  description: string;
  branch: string;
  electionYear: number;
  currentStage: 'STAGE_1' | 'STAGE_2';
  status: string;
  activeStageId?: any;
  rules: {
    stage1MaxCandidates: number;
    stage2CandidatesCount: number;
    voterQuorum?: number;
    notes?: string;
  };
}

export interface VoteSource {
  _id: string;
  electionId: string;
  stageId: string;
  sourceCode: string;
  sourceName: string;
  workUnit: string;
  location: string;
  targetVoters: number;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  activeSubmissionId?: any;
}

export interface VoteAuditLog {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason: string;
  timestamp: string;
}

export interface SystemSettings {
  _id?: string;
  appName: string;
  appTagline: string;
  organizationName: string;
  branchName: string;
  logoUrl: string;
  liveIndicator: boolean;
  allowCandidateEdit: boolean;
  publicQuickCountVisible: boolean;
  autoRefreshIntervalMs: number;
  maintenanceMode: boolean;
  contactEmail: string;
  contactPhone: string;
}
