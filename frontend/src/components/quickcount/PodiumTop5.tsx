import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Flame,
  Star,
  Sparkles,
  AlertCircle,
  LayoutGrid,
  List,
  CheckCircle2,
  Vote,
  ShieldCheck,
} from 'lucide-react';
import { CandidateRanking, QuickCountData } from '../../types';
import { CountUp } from '../common/CountUp';
import { BASE_URL } from '../../services/api';

interface PodiumTop5Props {
  top5: CandidateRanking[];
  quickCountData?: QuickCountData | null;
  isLoading?: boolean;
}

export const PodiumTop5: React.FC<PodiumTop5Props> = ({ top5, quickCountData, isLoading }) => {
  // Mobile view mode switcher: 'podium' or 'list'
  const [mobileViewMode, setMobileViewMode] = useState<'podium' | 'list'>('podium');

  const totalVotesIn =
    quickCountData?.totalVotesIn ?? top5?.reduce((sum, c) => sum + (c.votes || 0), 0) ?? 0;
  const targetVotes = quickCountData?.targetVotes ?? 25;
  const validVotes = quickCountData?.validVotes ?? totalVotesIn;
  const invalidVotes = quickCountData?.invalidVotes ?? 0;
  const stageType = quickCountData?.stageType ?? 'STAGE_2';
  const schemaRules = quickCountData?.schemaRules;
  const remainingVotes = Math.max(0, targetVotes - totalVotesIn);
  const progressPercentage =
    targetVotes > 0 ? Number(((totalVotesIn / targetVotes) * 100).toFixed(1)) : 0;

  if (!top5 || top5.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
          Data Podium Belum Tersedia
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Perhitungan suara belum dimulai atau belum ada formulir rekapitulasi TPS yang diverifikasi.
        </p>
      </div>
    );
  }

  // Visual accents definition according to prompt requirements
  const podiumStyles: Record<
    number,
    {
      borderColor: string;
      glowColor: string;
      badgeBg: string;
      badgeText: string;
      icon: any;
      accentBg: string;
      barColor: string;
      elevationClass: string;
      title: string;
    }
  > = {
    1: {
      borderColor: 'border-gold-500 dark:border-gold-400',
      glowColor: 'shadow-glow-gold ring-2 ring-gold-400/40',
      badgeBg: 'bg-gradient-to-r from-amber-400 to-gold-500',
      badgeText: 'text-navy-950 font-black',
      icon: Trophy,
      accentBg: 'bg-gold-500/10',
      barColor: 'from-amber-400 to-gold-500',
      elevationClass: 'lg:-translate-y-4 lg:scale-105 z-20',
      title: 'JUARA 1 SEMENTARA',
    },
    2: {
      borderColor: 'border-slate-400 dark:border-slate-400',
      glowColor: 'shadow-md ring-1 ring-slate-400/30',
      badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400',
      badgeText: 'text-navy-950 font-black',
      icon: Award,
      accentBg: 'bg-slate-500/10',
      barColor: 'from-slate-300 to-slate-400',
      elevationClass: 'lg:translate-y-0 z-10',
      title: 'PERINGKAT 2',
    },
    3: {
      borderColor: 'border-amber-700 dark:border-amber-600',
      glowColor: 'shadow-md ring-1 ring-amber-600/30',
      badgeBg: 'bg-gradient-to-r from-amber-600 to-amber-700',
      badgeText: 'text-white font-black',
      icon: Award,
      accentBg: 'bg-amber-600/10',
      barColor: 'from-amber-600 to-amber-700',
      elevationClass: 'lg:translate-y-2 z-10',
      title: 'PERINGKAT 3',
    },
    4: {
      borderColor: 'border-blue-500 dark:border-blue-400',
      glowColor: 'shadow-sm ring-1 ring-blue-500/30',
      badgeBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      badgeText: 'text-white font-bold',
      icon: Star,
      accentBg: 'bg-blue-500/10',
      barColor: 'from-blue-400 to-blue-500',
      elevationClass: 'lg:translate-y-5 z-0',
      title: 'PERINGKAT 4',
    },
    5: {
      borderColor: 'border-purple-500 dark:border-purple-400',
      glowColor: 'shadow-sm ring-1 ring-purple-500/30',
      badgeBg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      badgeText: 'text-white font-bold',
      icon: Sparkles,
      accentBg: 'bg-purple-500/10',
      barColor: 'from-purple-400 to-purple-500',
      elevationClass: 'lg:translate-y-7 z-0',
      title: 'PERINGKAT 5',
    },
  };

  const rank1 = top5.find((c) => c.rank === 1) || top5[0];
  const rank2 = top5.find((c) => c.rank === 2);
  const rank3 = top5.find((c) => c.rank === 3);
  const rank4 = top5.find((c) => c.rank === 4);
  const rank5 = top5.find((c) => c.rank === 5);

  // Stepped arrangement for desktop/laptop/large tablet
  const desktopPodiumList = [rank2, rank1, rank3, rank4, rank5].filter(Boolean) as CandidateRanking[];

  const podiumColumnsClass =
    desktopPodiumList.length <= 2
      ? 'lg:grid-cols-3'
      : desktopPodiumList.length === 3
      ? 'lg:grid-cols-4'
      : desktopPodiumList.length === 4
      ? 'lg:grid-cols-5'
      : 'lg:grid-cols-6';

  return (
    <div className="w-full mb-8 sm:mb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-600 dark:text-gold-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>REALTIME LIVE PEMILIHAN CALON KETUA SEKARPURA RESMI SEMENTARA</span>
          </div>
          <h2 className="text-xl 2xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
            LIVE TOP {Math.min(top5.length, 3)} CALON KETUA SEKARPURA BANDARA INTERNATIONAL HALIM PERDANAKUSUMA
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            Posisi tiga kandidat dengan perolehan suara terbanyak secara real-time
          </p>
        </div>

        {/* View Switcher on Small Screens */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1">
          <div className="lg:hidden flex items-center gap-1 bg-slate-100 dark:bg-navy-900 p-1 rounded-xl border border-slate-200 dark:border-navy-800">
            <button
              onClick={() => setMobileViewMode('podium')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === 'podium'
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Podium</span>
            </button>
            <button
              onClick={() => setMobileViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === 'list'
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">Realtime Sync</span>
          </div>
        </div>
      </div>

      {/* Desktop / Large Tablet: Stepped 3D Podium Grid (Candidates + Hasil Perhitungan Suara Cardview) */}
      <div className={`hidden lg:grid ${podiumColumnsClass} gap-3.5 xl:gap-4 items-end pt-8 pb-4`}>
        <AnimatePresence mode="popLayout">
          {desktopPodiumList.map((candidate) => {
            const style = podiumStyles[candidate.rank] || podiumStyles[5];
            const IconComponent = style.icon;
            const photoSrc = candidate.profilePhoto
              ? candidate.profilePhoto.startsWith('http')
                ? candidate.profilePhoto
                : `${BASE_URL}${candidate.profilePhoto}`
              : '/logo.svg';

            return (
              <motion.div
                key={candidate.candidateId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className={`relative flex flex-col justify-between rounded-3xl p-4 xl:p-5 bg-white dark:bg-navy-900 border-2 ${style.borderColor} ${style.glowColor} ${style.elevationClass} transition-all duration-300 min-h-[380px]`}
              >
                {/* Crown / Top Badge */}
                <div className="flex items-center justify-between gap-1 mb-3">
                  <div
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs shadow-sm ${style.badgeBg} ${style.badgeText}`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span>#{candidate.rank}</span>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                    No. {candidate.candidateNumber}
                  </span>
                </div>

                {/* Candidate Photo */}
                <div className="relative mx-auto mb-3">
                  <div
                    className={`w-20 h-20 xl:w-24 xl:h-24 rounded-2xl overflow-hidden border-2 ${style.borderColor} p-1 bg-slate-100 dark:bg-navy-800 shadow-md`}
                  >
                    <img
                      src={photoSrc}
                      alt={candidate.fullName}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                  </div>

                  {candidate.isTied && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-navy-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-white whitespace-nowrap">
                      SERI
                    </span>
                  )}

                  {candidate.isLeader && (
                    <div className="absolute -top-2.5 -right-2 bg-gold-400 text-navy-950 p-1 rounded-full shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-navy-950" />
                    </div>
                  )}
                </div>

                {/* Candidate Info */}
                <div className="text-center mb-3">
                  <h4
                    className="font-extrabold text-sm xl:text-base text-navy-900 dark:text-white leading-tight truncate"
                    title={candidate.fullName}
                  >
                    {candidate.nickname}
                  </h4>
                  <p className="text-[10px] xl:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {candidate.position}
                  </p>
                  <p className="text-[9px] xl:text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {candidate.workUnit}
                  </p>
                </div>

                {/* Votes & Percentage Display (Formatted as x / target e.g. 1 / 25 atau 3 / 25) */}
                <div
                  className={`rounded-2xl p-2.5 xl:p-3 text-center ${style.accentBg} border border-slate-200/50 dark:border-navy-800`}
                >
                  <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    Perolehan Suara
                  </p>
                  <div className="flex items-baseline justify-center gap-1 mt-0.5">
                    <span className="text-2xl xl:text-3xl font-black text-navy-900 dark:text-white">
                      <CountUp value={candidate.votes} />
                    </span>
                    <span className="text-xs xl:text-sm font-semibold text-slate-400 dark:text-slate-500">
                      / {targetVotes}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-xs font-extrabold text-electric-600 dark:text-electric-400">
                    <span>{candidate.percentage}%</span>
                    <span className="text-[9px] font-medium text-slate-400">
                      {candidate.diffFromLeader === 0
                        ? '(Peringkat 1)'
                        : `(-${candidate.diffFromLeader})`}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-navy-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <motion.div
                      className={`h-1.5 rounded-full bg-gradient-to-r ${style.barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(candidate.percentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* DEDICATED CARD VIEW: HASIL PERHITUNGAN SUARA (Side border untuk penegasan hasil) */}
          <motion.div
            key="card-hasil-perhitungan-suara"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col justify-between rounded-3xl p-4 xl:p-5 bg-gradient-to-b from-white via-white to-electric-50/50 dark:from-navy-900 dark:via-navy-900 dark:to-navy-950 border-2 border-slate-200 dark:border-navy-800 border-l-[6px] border-l-electric-600 dark:border-l-electric-400 shadow-xl ring-1 ring-electric-500/20 z-10 transition-all duration-300 min-h-[380px]"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs shadow-sm bg-gradient-to-r from-electric-600 to-indigo-600 text-white font-black">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>REKAPITULASI</span>
              </div>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-electric-500/10 text-electric-700 dark:text-electric-300 border border-electric-500/30">
                {stageType === 'STAGE_2' ? 'Tahap 2 Definitif' : 'Tahap 1 Penjaringan'}
              </span>
            </div>

            {/* Center Emblem Visual */}
            <div className="relative mx-auto mb-3">
              <div className="w-20 h-20 xl:w-24 xl:h-24 rounded-2xl overflow-hidden border-2 border-electric-500/80 dark:border-electric-400/80 p-2 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 shadow-md flex flex-col items-center justify-center text-center">
                <Flame className="w-7 h-7 text-gold-400 animate-pulse mb-1" />
                <span className="text-[9px] font-black uppercase text-gold-300 tracking-wider">
                  LIVE TALLY
                </span>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-white whitespace-nowrap">
                REAL-TIME
              </span>
            </div>

            {/* Summary Title & Subtitle */}
            <div className="text-center mb-3">
              <h4 className="font-extrabold text-sm xl:text-base text-navy-900 dark:text-white leading-tight">
                TOTAL SUARA MASUK
              </h4>
              <p className="text-[10px] xl:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Target {targetVotes} Suara Pemilih
              </p>
              <p className="text-[9px] xl:text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {remainingVotes > 0
                  ? `${remainingVotes} suara tersisa`
                  : 'Rekapitulasi Suara Selesai (100%)'}
              </p>
            </div>

            {/* Hasil Perhitungan Box (Cardview Metric) */}
            <div className="rounded-2xl p-2.5 xl:p-3 text-center bg-electric-500/10 dark:bg-electric-500/15 border border-electric-500/30">
              <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Hasil Perhitungan Suara
              </p>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="text-3xl xl:text-4xl font-black text-navy-900 dark:text-white">
                  <CountUp value={totalVotesIn} />
                </span>
                <span className="text-base xl:text-lg font-extrabold text-electric-600 dark:text-electric-400">
                  / {targetVotes}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-0.5 text-xs font-extrabold text-electric-600 dark:text-electric-400">
                <span>{progressPercentage}%</span>
                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  (Sah: {validVotes} | Rusak: {invalidVotes})
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-navy-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <motion.div
                  className="h-1.5 rounded-full bg-gradient-to-r from-electric-600 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile / Foldable / Tablet View */}
      <div className="lg:hidden">
        {mobileViewMode === 'podium' ? (
          /* Mobile Horizontal Scrollable Podium with Snap Cards */
          <div className="flex gap-3 overflow-x-auto pb-4 pt-2 -mx-3 px-3 scrollbar-none snap-x snap-mandatory">
            {/* Card 0: Hasil Perhitungan Suara on Mobile Snap View */}
            <div className="snap-center shrink-0 w-[240px] xs:w-[260px] rounded-3xl p-4 bg-gradient-to-b from-white to-electric-50/50 dark:from-navy-900 dark:to-navy-950 border-2 border-slate-200 dark:border-navy-800 border-l-[6px] border-l-electric-600 dark:border-l-electric-400 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs shadow-sm bg-gradient-to-r from-electric-600 to-indigo-600 text-white font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>REKAP SUARA</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/30">
                  {stageType === 'STAGE_2' ? 'Tahap 2' : 'Tahap 1'}
                </span>
              </div>

              <div className="relative mx-auto mb-3">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-electric-500 p-2 bg-gradient-to-br from-navy-900 to-navy-950 flex flex-col items-center justify-center text-center shadow-md">
                  <Flame className="w-6 h-6 text-gold-400 animate-pulse mb-0.5" />
                  <span className="text-[9px] font-black uppercase text-gold-300">LIVE TALLY</span>
                </div>
              </div>

              <div className="text-center mb-3">
                <h4 className="font-extrabold text-sm text-navy-900 dark:text-white truncate">
                  TOTAL SUARA MASUK
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Target {targetVotes} Suara Pemilih
                </p>
              </div>

              <div className="rounded-2xl p-2.5 text-center bg-electric-500/10 dark:bg-electric-500/15 border border-electric-500/30">
                <p className="text-[9px] uppercase font-bold text-slate-400">Hasil Perhitungan Suara</p>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-2xl font-black text-navy-900 dark:text-white">
                    <CountUp value={totalVotesIn} />
                  </span>
                  <span className="text-sm font-extrabold text-electric-600 dark:text-electric-400">
                    / {targetVotes}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-electric-600 dark:text-electric-400 mt-0.5">
                  <span>{progressPercentage}%</span>
                  <span className="text-[9px] font-medium text-slate-400">
                    ({remainingVotes} tersisa)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-navy-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-electric-600 to-emerald-400"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Candidate Snap Cards */}
            {top5.map((candidate) => {
              const style = podiumStyles[candidate.rank] || podiumStyles[5];
              const IconComponent = style.icon;
              const photoSrc = candidate.profilePhoto
                ? candidate.profilePhoto.startsWith('http')
                  ? candidate.profilePhoto
                  : `${BASE_URL}${candidate.profilePhoto}`
                : '/logo.svg';

              return (
                <div
                  key={candidate.candidateId}
                  className={`snap-center shrink-0 w-[240px] xs:w-[260px] rounded-3xl p-4 bg-white dark:bg-navy-900 border-2 ${style.borderColor} ${style.glowColor} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs shadow-sm ${style.badgeBg} ${style.badgeText}`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>#{candidate.rank}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                      No. {candidate.candidateNumber}
                    </span>
                  </div>

                  {/* Candidate Photo */}
                  <div className="relative mx-auto mb-3">
                    <div
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${style.borderColor} p-1 bg-slate-100 dark:bg-navy-800 shadow-md`}
                    >
                      <img
                        src={photoSrc}
                        alt={candidate.fullName}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.svg';
                        }}
                      />
                    </div>
                    {candidate.isLeader && (
                      <div className="absolute -top-2 -right-2 bg-gold-400 text-navy-950 p-1 rounded-full shadow">
                        <Star className="w-3.5 h-3.5 fill-navy-950" />
                      </div>
                    )}
                  </div>

                  <div className="text-center mb-3">
                    <h4 className="font-extrabold text-sm text-navy-900 dark:text-white truncate">
                      {candidate.nickname}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {candidate.position}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-2.5 text-center ${style.accentBg} border border-slate-200/50 dark:border-navy-800`}
                  >
                    <p className="text-[9px] uppercase font-bold text-slate-400">Total Suara</p>
                    <div className="flex items-baseline justify-center gap-1 mt-0.5">
                      <span className="text-2xl font-black text-navy-900 dark:text-white">
                        <CountUp value={candidate.votes} />
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        / {targetVotes}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-electric-600 dark:text-electric-400 mt-0.5">
                      <span>{candidate.percentage}%</span>
                      <span className="text-[9px] font-medium text-slate-400">
                        {candidate.diffFromLeader === 0
                          ? '(Leader)'
                          : `(-${candidate.diffFromLeader})`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${style.barColor}`}
                        style={{ width: `${Math.min(candidate.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Mobile Sleek Vertical List Cards */
          <div className="space-y-2.5">
            {/* Pinned Cardview for Hasil Perhitungan Suara */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-electric-50 to-white dark:from-navy-800/80 dark:to-navy-900 border-2 border-electric-500/40 border-l-[6px] border-l-electric-600 dark:border-l-electric-400 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-electric-600 text-white font-black shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs xs:text-sm text-navy-900 dark:text-white truncate">
                    Total Suara Masuk
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Target {targetVotes} Suara (Sah: {validVotes} | Rusak: {invalidVotes})
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-base font-black text-navy-900 dark:text-white">
                  <CountUp value={totalVotesIn} />{' '}
                  <span className="text-xs font-bold text-electric-600 dark:text-electric-400">
                    / {targetVotes}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-electric-600 dark:text-electric-400">
                  {progressPercentage}%
                </div>
              </div>
            </div>

            {top5.map((candidate) => {
              const style = podiumStyles[candidate.rank] || podiumStyles[5];
              const photoSrc = candidate.profilePhoto
                ? candidate.profilePhoto.startsWith('http')
                  ? candidate.profilePhoto
                  : `${BASE_URL}${candidate.profilePhoto}`
                : '/logo.svg';

              return (
                <div
                  key={candidate.candidateId}
                  className={`p-3 rounded-2xl bg-white dark:bg-navy-900 border-2 ${style.borderColor} ${style.glowColor} flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${style.badgeBg} ${style.badgeText}`}
                    >
                      #{candidate.rank}
                    </div>

                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-slate-300 dark:border-navy-700 bg-slate-100">
                      <img
                        src={photoSrc}
                        alt={candidate.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.svg';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs xs:text-sm text-navy-900 dark:text-white truncate">
                          {candidate.nickname}
                        </h4>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 shrink-0">
                          No. {candidate.candidateNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {candidate.position}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-navy-900 dark:text-white">
                      <CountUp value={candidate.votes} />{' '}
                      <span className="text-xs text-slate-400">/ {targetVotes}</span>
                    </div>
                    <div className="text-[11px] font-bold text-electric-600 dark:text-electric-400">
                      {candidate.percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Definitive Election Schema Notification Banner */}
      {schemaRules && (
        <div className="mt-4 sm:mt-6">
          {schemaRules.stageType === 'STAGE_1' ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white">
                  Ketentuan Pemilihan Tahap 1 (Penjaringan Bakal Calon)
                </p>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kandidat dinyatakan menang mutlak jika menerima surat suara dengan ketentuan{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-extrabold">
                    ≥ 50% + 1
                  </strong>{' '}
                  ({schemaRules.stage1.threshold50Plus1} suara sah). Apabila tidak ada yang mencapai ketentuan tersebut, maka diambil{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-extrabold">
                    2 calon peraih suara terbanyak
                  </strong>{' '}
                  untuk melaju ke Tahap 2 Definitif.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {schemaRules.stage2.is5050Tie && !schemaRules.stage2.gmTieBreakerCast ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-2 border-amber-500 text-navy-950 dark:text-white text-xs shadow-lg animate-pulse">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <strong className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                      ⚖️ KETENTUAN TAHAP 2: STATUS SERI 50% - 50%
                    </strong>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    Kedua calon memperoleh suara sama imbang (50% : 50%). Sesuai Tata Tertib Pemilihan Definitif SEKARPURA Halim,{' '}
                    <strong className="text-amber-700 dark:text-amber-300 font-extrabold">
                      otomatis ada penambahan 1 suara yang akan diambil oleh General Manager Bandara Halim Perdanakusuma
                    </strong>{' '}
                    untuk menentukan Ketua Definitif.
                  </p>
                </div>
              ) : schemaRules.stage2.gmTieBreakerCast ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-950 dark:text-white text-xs shadow-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-gold-500 shrink-0" />
                    <strong className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                      🏆 PEMENANG DEFINITIF KETUA SEKARPURA HALIM TERPILIH
                    </strong>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    Setelah hasil seri 50%-50%,{' '}
                    <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {schemaRules.stage2.gmTieBreakerCandidateName || 'Calon Terpilih'}
                    </strong>{' '}
                    menerima 1 Suara Penentu dari{' '}
                    <strong>General Manager Bandara Halim Perdanakusuma</strong> dan sah ditetapkan sebagai Ketua Definitif SEKARPURA Halim.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-electric-500/10 border border-electric-500/30 text-electric-900 dark:text-electric-200 text-xs flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-electric-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white">
                      Ketentuan Pemilihan Tahap 2 (Calon Ketua Definitif)
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Calon dengan suara terbanyak ditetapkan sebagai Ketua Definitif. Apabila terjadi hasil seri{' '}
                      <strong className="text-electric-600 dark:text-electric-400 font-extrabold">
                        50% : 50%
                      </strong>
                      , maka otomatis ada tambah{' '}
                      <strong className="text-electric-600 dark:text-electric-400 font-extrabold">
                        1 suara yang akan diambil oleh General Manager Bandara Halim PK
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
