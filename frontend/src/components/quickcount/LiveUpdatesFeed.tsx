import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { QuickCountData } from '../../types';

interface LiveUpdatesFeedProps {
  activities: QuickCountData['recentActivities'];
}

export const LiveUpdatesFeed: React.FC<LiveUpdatesFeedProps> = ({ activities }) => {
  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
            Aktivitas Rekapitulasi Live
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-400">Verifikasi Resmi</span>
      </div>

      <div className="space-y-2.5">
        {activities && activities.length > 0 ? (
          activities.map((act) => {
            const timeStr = new Date(act.verifiedAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={act.id}
                className="flex items-center justify-between gap-2.5 p-2.5 xs:p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-navy-900 dark:text-white">
                        {act.sourceCode}
                      </span>
                      {act.revision > 1 && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-500 font-bold px-1 rounded">
                          Rev #{act.revision}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {act.sourceName} • {act.workUnit}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-extrabold text-navy-900 dark:text-white text-xs sm:text-sm">
                    {act.totalVotes} <span className="text-[10px] font-normal text-slate-400">Suara</span>
                  </span>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{timeStr}</span>
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-slate-400 text-center py-6">
            Belum ada formulir rekapitulasi TPS yang masuk.
          </p>
        )}
      </div>
    </div>
  );
};
