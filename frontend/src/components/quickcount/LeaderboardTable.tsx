import React, { useState } from 'react';
import { Trophy, Award, Star, Minus, Table as TableIcon, LayoutList } from 'lucide-react';
import { CandidateRanking } from '../../types';
import { CountUp } from '../common/CountUp';
import { BASE_URL } from '../../services/api';

interface LeaderboardTableProps {
  rankings: CandidateRanking[];
  targetVotes?: number;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ rankings, targetVotes }) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
            Tabel Rekapitulasi & Ranking Keseluruhan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Urutan peringkat seluruh calon ketua berdasarkan jumlah suara sah yang telah diverifikasi
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile view toggle */}
          <div className="sm:hidden flex items-center gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'table' ? 'bg-white dark:bg-navy-700 shadow-sm text-electric-500' : 'text-slate-400'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'cards' ? 'bg-white dark:bg-navy-700 shadow-sm text-electric-500' : 'text-slate-400'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300">
            {rankings.length} Kandidat
          </span>
        </div>
      </div>

      {/* Mobile Card List (when viewMode is 'cards' on mobile) */}
      <div className={`sm:hidden space-y-2.5 ${viewMode === 'cards' ? 'block' : 'hidden'}`}>
        {rankings.map((c) => {
          const photoSrc = c.profilePhoto
            ? c.profilePhoto.startsWith('http')
              ? c.profilePhoto
              : `${BASE_URL}${c.profilePhoto}`
            : '/logo.svg';

          return (
            <div
              key={c.candidateId}
              className={`p-3 rounded-2xl border text-xs ${
                c.rank === 1
                  ? 'bg-gold-500/5 border-gold-500/30'
                  : 'bg-slate-50 dark:bg-navy-800/40 border-slate-200 dark:border-navy-700/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${
                      c.rank === 1
                        ? 'bg-gold-500 text-navy-950'
                        : c.rank === 2
                        ? 'bg-slate-300 text-navy-950'
                        : c.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-200 dark:bg-navy-700 text-slate-500'
                    }`}
                  >
                    #{c.rank}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-navy-700 px-1.5 py-0.2 rounded text-[10px]">
                    No. {c.candidateNumber}
                  </span>
                  {c.rank === 1 && (
                    <span className="text-[9px] bg-gold-400 text-navy-950 font-black px-1.5 py-0.2 rounded-full">
                      LEADER
                    </span>
                  )}
                  {c.isTied && (
                    <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                      SERI
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-navy-900 dark:text-white">
                    <CountUp value={c.votes} />
                    {targetVotes && (
                      <span className="text-[11px] font-normal text-slate-400"> / {targetVotes}</span>
                    )}
                  </span>
                  <span className="text-[11px] font-bold text-electric-600 dark:text-electric-400 ml-1.5">
                    ({c.percentage}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <img
                  src={photoSrc}
                  alt={c.fullName}
                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-navy-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-navy-900 dark:text-white truncate">{c.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.position} • {c.workUnit}</p>
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-navy-700 rounded-full h-1 mt-2.5 overflow-hidden">
                <div
                  className="bg-electric-500 h-1 rounded-full"
                  style={{ width: `${Math.min(c.percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Responsive Table View */}
      <div className={`overflow-x-auto ${viewMode === 'table' ? 'block' : 'hidden sm:block'}`}>
        <table className="w-full text-left text-sm min-w-[620px] sm:min-w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 dark:text-slate-500 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2.5 sm:py-3 px-2 sm:px-3">Rank</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3">No.</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3">Kandidat</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3">Unit Kerja</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">Perolehan Suara</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">Persentase</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">Selisih (#1)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60 font-medium">
            {rankings.map((c) => {
              const photoSrc = c.profilePhoto
                ? c.profilePhoto.startsWith('http')
                  ? c.profilePhoto
                  : `${BASE_URL}${c.profilePhoto}`
                : '/logo.svg';

              return (
                <tr
                  key={c.candidateId}
                  className={`hover:bg-slate-50/70 dark:hover:bg-navy-800/40 transition-colors ${
                    c.rank === 1 ? 'bg-gold-500/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-2 sm:px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          c.rank === 1
                            ? 'bg-gold-500 text-navy-950 shadow-sm'
                            : c.rank === 2
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white'
                            : c.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-navy-800 text-slate-500'
                        }`}
                      >
                        #{c.rank}
                      </span>
                      {c.isTied && (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded">
                          Seri
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Candidate Number */}
                  <td className="py-3 px-2 sm:px-3 whitespace-nowrap">
                    <span className="font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                      {c.candidateNumber}
                    </span>
                  </td>

                  {/* Candidate Photo & Name */}
                  <td className="py-3 px-2 sm:px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={photoSrc}
                        alt={c.fullName}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-slate-200 dark:border-navy-700 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.svg';
                        }}
                      />
                      <div className="min-w-0 max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-navy-900 dark:text-white text-xs sm:text-sm truncate">
                            {c.fullName}
                          </p>
                          {c.rank === 1 && (
                            <span className="text-[9px] bg-gold-400 text-navy-950 font-black px-1.5 py-0.2 rounded-full shrink-0">
                              LEADER
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          "{c.nickname}" - {c.position}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Work Unit */}
                  <td className="py-3 px-2 sm:px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {c.workUnit}
                  </td>

                  {/* Votes */}
                  <td className="py-3 px-2 sm:px-3 text-right font-black text-xs sm:text-sm text-navy-900 dark:text-white whitespace-nowrap">
                    <CountUp value={c.votes} />
                    {targetVotes && (
                      <span className="text-[11px] font-normal text-slate-400"> / {targetVotes}</span>
                    )}
                  </td>

                  {/* Percentage */}
                  <td className="py-3 px-2 sm:px-3 text-right whitespace-nowrap">
                    <div className="inline-block text-right">
                      <span className="font-extrabold text-xs text-electric-600 dark:text-electric-400">
                        {c.percentage}%
                      </span>
                      <div className="w-12 sm:w-16 bg-slate-100 dark:bg-navy-800 rounded-full h-1 mt-1 ml-auto">
                        <div
                          className="bg-electric-500 h-1 rounded-full"
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Diff from #1 */}
                  <td className="py-3 px-2 sm:px-3 text-right text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                    {c.diffFromLeader === 0 ? (
                      <span className="text-gold-500 font-bold">-</span>
                    ) : (
                      `-${c.diffFromLeader}`
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
