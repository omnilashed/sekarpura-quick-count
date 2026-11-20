import React, { useEffect, useState } from 'react';
import { useQuickcountStore } from '../../stores/quickcountStore';
import { electionService } from '../../services/electionService';
import { ElectionStage } from '../../types';
import { HeroQuickCount } from '../../components/quickcount/HeroQuickCount';
import { PodiumTop5 } from '../../components/quickcount/PodiumTop5';
import { VoteDistributionChart } from '../../components/quickcount/VoteDistributionChart';
import { VoteShareDonut } from '../../components/quickcount/VoteShareDonut';
import { LeaderboardTable } from '../../components/quickcount/LeaderboardTable';
import { CountingProgressCard } from '../../components/quickcount/CountingProgressCard';
import { HistoricalTrendChart } from '../../components/quickcount/HistoricalTrendChart';
import { LiveUpdatesFeed } from '../../components/quickcount/LiveUpdatesFeed';

export const LiveQuickCountPage: React.FC = () => {
  const { data, isLoading, fetchQuickCount, setSelectedStageId, initSocket, startAutoRefresh, stopAutoRefresh } =
    useQuickcountStore();
  const [stages, setStages] = useState<ElectionStage[]>([]);

  useEffect(() => {
    electionService
      .getStages()
      .then((res) => {
        setStages(res);
      })
      .catch((err) => console.error(err));

    fetchQuickCount();
    initSocket();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Stage Selector Tab */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg xs:text-xl font-extrabold text-navy-900 dark:text-white">
            Pusat Data Real-Time QuickCount
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih tahapan pemilihan untuk melihat tabulasi perolehan suara masing-masing tahap
          </p>
        </div>

        {/* Stage selection buttons */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 bg-slate-50 dark:bg-navy-800 p-1.5 rounded-2xl border border-slate-200 dark:border-navy-700 w-full sm:w-auto">
          {stages.map((stg) => {
            const isActive = data?.stageId === stg._id;
            return (
              <button
                key={stg._id}
                onClick={() => setSelectedStageId(stg._id)}
                className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[40px] flex items-center justify-center ${
                  isActive
                    ? 'bg-electric-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                {stg.stageType === 'STAGE_1' ? 'Tahap 1 (Bakal Calon)' : 'Tahap 2 (Definitif)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero QuickCount Component */}
      <HeroQuickCount
        data={data}
        isLoading={isLoading}
        onRefresh={() => fetchQuickCount()}
      />

      {/* Podium Top 5 with Hasil Perhitungan Suara */}
      <PodiumTop5 top5={data?.top5 || []} quickCountData={data} isLoading={isLoading} />

      {/* Analytics Dashboard Grid */}
      {data && data.rankings && data.rankings.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <VoteDistributionChart rankings={data.rankings} />
            <VoteShareDonut rankings={data.rankings} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <HistoricalTrendChart timeline={data.timeline} top5={data.top5} />
            </div>
            <div>
              <CountingProgressCard data={data} />
            </div>
          </div>

          <LeaderboardTable rankings={data.rankings} targetVotes={data?.targetVotes || 25} />

          <LiveUpdatesFeed activities={data.recentActivities} />
        </div>
      )}
    </div>
  );
};
