import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CandidateRanking } from '../../types';
import { useThemeStore } from '../../stores/themeStore';
import { BarChart3, ListOrdered } from 'lucide-react';

interface VoteDistributionChartProps {
  rankings: CandidateRanking[];
}

export const VoteDistributionChart: React.FC<VoteDistributionChartProps> = ({ rankings }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<'chart' | 'bars'>('chart');

  const chartData = rankings.map((r) => ({
    name: `No.${r.candidateNumber}`,
    fullName: r.fullName,
    nickname: r.nickname,
    votes: r.votes,
    percentage: r.percentage,
    rank: r.rank,
  }));

  const getBarColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#F5C451'; // Gold
      case 2:
        return '#94A3B8'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      case 4:
        return '#3B82F6'; // Blue
      case 5:
        return '#8B5CF6'; // Purple
      default:
        return '#64748B'; // Slate
    }
  };

  const maxVotes = Math.max(...rankings.map((r) => r.votes), 1);

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
            Distribusi Suara Per Kandidat
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Akumulasi perolehan suara sah seluruh calon ketua
          </p>
        </div>

        {/* View mode toggle button */}
        <div className="flex items-center gap-1 self-start sm:self-center bg-slate-100 dark:bg-navy-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'chart'
                ? 'bg-white dark:bg-navy-700 text-electric-600 dark:text-electric-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Grafik</span>
          </button>
          <button
            onClick={() => setViewMode('bars')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'bars'
                ? 'bg-white dark:bg-navy-700 text-electric-600 dark:text-electric-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Baris</span>
          </button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-64 sm:h-72 w-full overflow-x-auto">
          <div className="min-w-[280px] xs:min-w-[340px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1E293B' : '#E2E8F0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  stroke={isDark ? '#94A3B8' : '#64748B'}
                  fontSize={10}
                  allowDecimals={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1630' : '#FFFFFF',
                    borderColor: isDark ? '#1E3E6E' : '#E2E8F0',
                    borderRadius: '12px',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, _name: any, item: any) => [
                    `${value} suara (${item.payload.percentage}%)`,
                    item.payload.fullName || 'Kandidat',
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.rank)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Horizontal Bars for great mobile experience */
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {rankings.map((r) => {
            const pct = ((r.votes / maxVotes) * 100).toFixed(0);
            const color = getBarColor(r.rank);

            return (
              <div
                key={r.candidateId}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60 text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 text-white"
                      style={{ backgroundColor: color }}
                    >
                      {r.candidateNumber}
                    </span>
                    <span className="font-extrabold text-navy-900 dark:text-white truncate">
                      {r.nickname}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate hidden xs:inline">
                      ({r.workUnit})
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-navy-900 dark:text-white">
                      {r.votes}{' '}
                      <span className="text-[10px] font-normal text-slate-400">suara</span>
                    </span>
                    <span className="ml-1.5 font-bold text-electric-600 dark:text-electric-400">
                      {r.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-navy-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
