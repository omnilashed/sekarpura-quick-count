import React from 'react';
import { Radio, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Clock } from 'lucide-react';
import { QuickCountData } from '../../types';
import { CountUp } from '../common/CountUp';
import { StatusBadge } from '../common/StatusBadge';

interface HeroQuickCountProps {
  data: QuickCountData | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const HeroQuickCount: React.FC<HeroQuickCountProps> = ({ data, isLoading, onRefresh }) => {
  const isCounting = data?.stageStatus === 'COUNTING';

  return (
    <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 border border-slate-700/60 shadow-2xl p-4 sm:p-7 md:p-10 text-white mb-8 sm:mb-10">
      {/* Decorative ambient glowing circles */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-electric-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar: Live indicator + Stage Badge + Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-6 relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          {isCounting ? (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] sm:text-xs font-black tracking-wider animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>LIVE COUNTING</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-700/60 border border-slate-600 text-slate-300 text-[10px] sm:text-xs font-semibold">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>STATUS: {data?.stageStatus || 'PENDING'}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-navy-800/80 border border-slate-700 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium text-slate-200">
            <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold-400" />
            <span className="truncate max-w-[140px] xs:max-w-none">{data?.stageName || 'Tahap Pemilihan'}</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-navy-800/90 hover:bg-navy-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Muat Ulang Data Terbaru"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isLoading ? 'animate-spin text-electric-400' : ''}`} />
            <span className="hidden 2xs:inline">Sinkronisasi</span>
          </button>
        )}
      </div>

      {/* Main Title & Subtitle */}
      <div className="relative z-10 max-w-3xl mb-6 sm:mb-8">
        <h1 className="text-2xl 2xs:text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          SEKARPURA <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-amber-300">ELECTION CENTER</span>
        </h1>
        <p className="text-xs sm:text-base md:text-lg font-medium text-slate-300 mt-1.5 sm:mt-2">
          Live QuickCount Pemilihan Ketua Serikat Pekerja Angkasa Pura Indonesia Cabang Halim Perdanakusuma
        </p>
        <p className="text-[11px] sm:text-sm text-gold-400/90 italic font-normal mt-1">
          "Transparansi Demokrasi, Membangun Solidaritas Pekerja."
        </p>
      </div>

      {/* Primary Key Metrics Grid - Adaptive 2 cols on mobile (1 col on extreme <300px), 4 cols on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
        {/* Metric 1: Total Suara Masuk */}
        <div className="bg-navy-900/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 border border-slate-700/70 hover:border-gold-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Total Suara Masuk</p>
          <div className="text-xl 2xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-0.5 sm:mt-1">
            <CountUp value={data?.totalVotesIn || 0} />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            Sah: <span className="text-emerald-400 font-bold">{data?.validVotes || 0}</span> | Tdk: <span className="text-rose-400 font-bold">{data?.invalidVotes || 0}</span>
          </p>
        </div>

        {/* Metric 2: Progres Sumber Suara */}
        <div className="bg-navy-900/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 border border-slate-700/70 hover:border-electric-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Progres TPS Masuk</p>
          <div className="text-xl 2xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-electric-400 mt-0.5 sm:mt-1">
            {data?.progressPercentage || 0}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 sm:mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-electric-500 to-electric-400 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(data?.progressPercentage || 0, 100)}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 sm:mt-1.5 truncate">
            {data?.completedSourcesCount || 0} / {data?.targetSourcesCount || 0} TPS
          </p>
        </div>

        {/* Metric 3: Suara Sah Terhitung */}
        <div className="bg-navy-900/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 border border-slate-700/70 hover:border-emerald-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Suara Sah</p>
          <div className="text-xl 2xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-400 mt-0.5 sm:mt-1">
            <CountUp value={data?.validVotes || 0} />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {data?.totalVotesIn && data.totalVotesIn > 0
              ? `${((data.validVotes / data.totalVotesIn) * 100).toFixed(1)}% dari total`
              : 'Menunggu rekap'}
          </p>
        </div>

        {/* Metric 4: Pemimpin Sementara */}
        <div className="bg-navy-900/80 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 border border-slate-700/70 hover:border-gold-500/40 transition-colors">
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Pemimpin Sementara (#1)</p>
          <div className="text-sm 2xs:text-base sm:text-lg font-bold text-gold-400 mt-0.5 sm:mt-1 truncate">
            {data?.top5?.[0] ? `${data.top5[0].nickname}` : '-'}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
            {data?.top5?.[0] ? `${data.top5[0].votes} suara (${data.top5[0].percentage}%)` : 'Belum ada suara'}
          </p>
        </div>
      </div>

      {/* Official Integrity Disclaimer Box */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800 flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Pemberitahuan Resmi:</strong> Hasil QuickCount di atas merupakan tabulasi rekapitulasi real-time dari formulir plano resmi TPS yang telah diverifikasi saksi. Hasil ini bersifat sementara sampai pengesahan pleno Panitia Pemilihan Ketua SEKARPURA Halim.
        </p>
      </div>
    </section>
  );
};
