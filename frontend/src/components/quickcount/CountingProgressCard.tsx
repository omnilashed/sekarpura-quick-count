import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { QuickCountData } from '../../types';

interface CountingProgressCardProps {
  data: QuickCountData;
}

export const CountingProgressCard: React.FC<CountingProgressCardProps> = ({ data }) => {
  const completed = data.completedSourcesCount;
  const target = data.targetSourcesCount;
  const pending = Math.max(0, target - completed);
  const percentage = data.progressPercentage;

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
            Progres Rekapitulasi TPS
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Status penerimaan formulir berita acara resmi seluruh TPS
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xl sm:text-2xl font-black text-electric-600 dark:text-electric-400">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-3 mb-4 sm:mb-6 overflow-hidden p-0.5 border border-slate-200 dark:border-navy-700">
        <div
          className="bg-gradient-to-r from-electric-600 via-electric-500 to-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Breakdown Badges */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-extrabold text-xs sm:text-sm">{completed} TPS</p>
            <p className="text-[10px] sm:text-[11px] opacity-80 truncate">Telah Diverifikasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300">
          <Clock className="w-4 h-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-extrabold text-xs sm:text-sm">{pending} TPS</p>
            <p className="text-[10px] sm:text-[11px] opacity-80 truncate">Belum Masuk / Rekap</p>
          </div>
        </div>
      </div>
    </div>
  );
};
