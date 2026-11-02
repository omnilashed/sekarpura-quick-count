import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Presentation,
  ArrowRight,
} from 'lucide-react';
import { useQuickcountStore } from '../../stores/quickcountStore';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { HeroQuickCount } from '../../components/quickcount/HeroQuickCount';
import { PodiumTop5 } from '../../components/quickcount/PodiumTop5';
import { VoteDistributionChart } from '../../components/quickcount/VoteDistributionChart';
import { VoteShareDonut } from '../../components/quickcount/VoteShareDonut';
import { LeaderboardTable } from '../../components/quickcount/LeaderboardTable';
import { CountingProgressCard } from '../../components/quickcount/CountingProgressCard';
import { HistoricalTrendChart } from '../../components/quickcount/HistoricalTrendChart';
import { LiveUpdatesFeed } from '../../components/quickcount/LiveUpdatesFeed';
import { CandidateCard } from '../../components/candidate/CandidateCard';

export const HomePage: React.FC = () => {
  const { data, isLoading, fetchQuickCount, initSocket } = useQuickcountStore();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [, setLoadingCandidates] = useState(true);

  useEffect(() => {
    fetchQuickCount();
    initSocket();

    // Fetch featured candidates
    candidateService
      .getAll({ publicationStatus: 'PUBLISHED' })
      .then((res) => {
        setCandidates(res.data.slice(0, 4));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingCandidates(false));
  }, []);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* 1. Hero Command Center Banner */}
      <HeroQuickCount
        data={data}
        isLoading={isLoading}
        onRefresh={() => fetchQuickCount()}
      />

      {/* 2. LIVE TOP 5 CANDIDATE PODIUM */}
      <PodiumTop5 top5={data?.top5 || []} isLoading={isLoading} />

      {/* 3. Live Vote Statistics & Charts Grid */}
      {data && data.rankings && data.rankings.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white">
                Statistik & Analitika Pemilihan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Visualisasi data perolehan suara sah dan distribusi dukungan
              </p>
            </div>
            <Link
              to="/quickcount"
              className="text-xs font-bold text-electric-600 dark:text-electric-400 hover:underline inline-flex items-center gap-1 self-start xs:self-auto py-1"
            >
              <span>Lihat Detail Analitik</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <VoteDistributionChart rankings={data.rankings} />
            <VoteShareDonut rankings={data.rankings} />
          </div>

          {/* Historical Trends & Counting Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <HistoricalTrendChart timeline={data.timeline} top5={data.top5} />
            </div>
            <div>
              <CountingProgressCard data={data} />
            </div>
          </div>

          {/* Full Leaderboard Table */}
          <LeaderboardTable rankings={data.rankings} />

          {/* Live Activities Feed */}
          <LiveUpdatesFeed activities={data.recentActivities} />
        </section>
      )}

      {/* 4. Candidates Showcase Section */}
      <section className="pt-6 border-t border-slate-200 dark:border-navy-800">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Gagasan & Kepemimpinan</span>
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
              Kandidat Ketua SEKARPURA Halim
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Kenali visi, misi, rekam jejak, dan program prioritas insan terbaik serikat pekerja
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/bakal-calon"
              className="flex-1 xs:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-electric-500 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
            >
              Semua Bakal Calon
            </Link>
            <Link
              to="/calon-ketua"
              className="flex-1 xs:flex-none text-center px-3.5 py-2 rounded-xl text-xs font-bold bg-electric-600 hover:bg-electric-500 text-white transition-all shadow-md shadow-electric-600/20"
            >
              Calon Definitif
            </Link>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate._id} candidate={candidate} />
          ))}
        </div>
      </section>

      {/* 5. Presentation Library Callout Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border border-slate-700/60 p-5 xs:p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs font-bold uppercase">
            <Presentation className="w-3.5 h-3.5" />
            <span>Materi Kampanye Digital</span>
          </div>
          <h3 className="text-xl xs:text-2xl sm:text-3xl font-black leading-tight">
            Pelajari Paparan Gagasan & Materi Presentasi Kandidat
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Seluruh anggota serikat dapat memutar dan menelaah slide presentasi PowerPoint / PDF yang diunggah resmi oleh setiap kandidat melalui pemutar presentasi interaktif kami.
          </p>
          <div className="pt-2">
            <Link
              to="/presentasi"
              className="inline-flex items-center justify-center gap-2 w-full xs:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-gold-500/20 transition-all min-h-[44px]"
            >
              <span>Buka Perpustakaan Presentasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
