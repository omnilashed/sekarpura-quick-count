import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'stage' | 'candidacy' | 'verification' | 'source';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'stage' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      // Stage & Quickcount status
      case 'COUNTING':
      case 'PRELIMINARY_COUNTING':
      case 'FINAL_COUNTING':
        return {
          label: 'SEDANG BERLANGSUNG',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'COMPLETED':
      case 'PRELIMINARY_COMPLETED':
      case 'FINAL_COMPLETED':
        return {
          label: 'SELESAI',
          bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
          dot: 'bg-blue-500',
        };
      case 'LOCKED':
        return {
          label: 'DIKUNCI',
          bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-500',
        };
      case 'PENDING':
      case 'DRAFT':
        return {
          label: 'MENUNGGU',
          bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };

      // Candidacy status
      case 'BAKAL_CALON':
        return {
          label: 'BAKAL CALON',
          bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-500',
        };
      case 'CALON_TETAP':
        return {
          label: 'CALON DEFINITIF',
          bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'TERPILIH':
        return {
          label: 'KETUA TERPILIH',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'DISKUALIFIKASI':
        return {
          label: 'DISKUALIFIKASI',
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };

      // Verification status
      case 'VERIFIED':
        return {
          label: 'TERVERIFIKASI',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'REJECTED':
        return {
          label: 'DITOLAK',
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };

      // Statement status
      case 'BERSEDIA':
        return {
          label: 'BERSEDIA',
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'TIDAK_BERSEDIA':
        return {
          label: 'TIDAK BERSEDIA',
          bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
        };

      // Vote source status
      case 'NOT_SUBMITTED':
        return {
          label: 'BELUM MASUK',
          bg: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
        };

      default:
        return {
          label: status,
          bg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
