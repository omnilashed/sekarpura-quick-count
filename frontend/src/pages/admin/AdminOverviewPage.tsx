import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Vote,
  Layers,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Award,
} from 'lucide-react';
import { useQuickcountStore } from '../../stores/quickcountStore';
import { candidateService } from '../../services/candidateService';
import { settingsService } from '../../services/settingsService';
import { VoteAuditLog } from '../../types';
import { CountUp } from '../../components/common/CountUp';

export const AdminOverviewPage: React.FC = () => {
  const { data, isLoading, fetchQuickCount } = useQuickcountStore();
  const [candidatesCount, setCandidatesCount] = useState({ total: 0, stage2: 0, pending: 0 });
  const [recentLogs, setRecentLogs] = useState<VoteAuditLog[]>([]);

  useEffect(() => {
    fetchQuickCount();

    // Load counts
    candidateService.getAll().then((res) => {
      const total = res.data.length;
      const stage2 = res.data.filter((c) => c.stage2Qualified).length;
      const pending = res.data.filter((c) => c.verificationStatus === 'PENDING').length;
      setCandidatesCount({ total, stage2, pending });
    });

    settingsService.getAuditLogs({ limit: 5 }).then((res) => {
      setRecentLogs(res.logs);
    });
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
              Dashboard Utama Pengelola Pemilihan
            </h1>
            {data?.stageName && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-electric-500/15 text-electric-600 dark:text-electric-400 border border-electric-500/30">
                Tahap Aktif: {data.stageName} ({data.stageStatus})
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ringkasan progres real-time rekapitulasi suara dan pengawasan tahapan pemilihan
          </p>
        </div>

        <button
          onClick={() => fetchQuickCount()}
          className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-electric-500 shadow-sm self-start sm:self-auto min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Bakal Calon */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Total Bakal Calon</span>
            <Users className="w-5 h-5 text-electric-500 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white">
            {candidatesCount.total}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {candidatesCount.pending > 0 ? (
              <span className="text-amber-500 font-bold">{candidatesCount.pending} Menunggu verifikasi</span>
            ) : (
              'Semua terverifikasi'
            )}
          </p>
        </div>

        {/* Calon Definitif */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Calon Definitif</span>
            <Award className="w-5 h-5 text-gold-500 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gold-500">
            {candidatesCount.stage2}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Lolos Tahap 2 Final
          </p>
        </div>

        {/* Suara Masuk */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Suara Masuk</span>
            <Vote className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            <CountUp value={data?.totalVotesIn || 0} />
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            Sah: {data?.validVotes || 0} | Tidak Sah: {data?.invalidVotes || 0}
          </p>
        </div>

        {/* Progres TPS */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Progres Rekap TPS</span>
            <MapPin className="w-5 h-5 text-purple-500 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {data?.progressPercentage || 0}%
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
            {data?.completedSourcesCount || 0} dari {data?.targetSourcesCount || 0} TPS terverifikasi
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        <Link
          to="/admin/quickcount"
          className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-electric-600 to-electric-500 text-white shadow-lg shadow-electric-600/20 hover:from-electric-500 hover:to-electric-600 transition-all flex items-center justify-between min-h-[90px]"
        >
          <div className="min-w-0 pr-2">
            <h3 className="font-extrabold text-sm sm:text-base truncate">Input / Koreksi Suara TPS</h3>
            <p className="text-[11px] sm:text-xs text-white/80 mt-1 truncate">Rekap Berita Acara & sinkronisasi realtime</p>
          </div>
          <Vote className="w-7 sm:w-8 h-7 sm:h-8 text-white/80 shrink-0" />
        </Link>

        <Link
          to="/admin/stages"
          className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-navy-900 to-navy-800 text-white border border-slate-700/60 shadow-lg hover:border-gold-500/50 transition-all flex items-center justify-between min-h-[90px]"
        >
          <div className="min-w-0 pr-2">
            <h3 className="font-extrabold text-sm sm:text-base truncate">Atur Tahap & Loloskan Calon</h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 truncate">Penetapan 5 calon definitif Tahap 2</p>
          </div>
          <Layers className="w-7 sm:w-8 h-7 sm:h-8 text-gold-400 shrink-0" />
        </Link>

        <Link
          to="/admin/reports"
          className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-600 transition-all flex items-center justify-between min-h-[90px] sm:col-span-2 md:col-span-1"
        >
          <div className="min-w-0 pr-2">
            <h3 className="font-extrabold text-sm sm:text-base truncate">Ekspor Laporan Pemilihan</h3>
            <p className="text-[11px] sm:text-xs text-white/80 mt-1 truncate">Unduh hasil resmi dalam PDF, Excel, & CSV</p>
          </div>
          <ShieldCheck className="w-7 sm:w-8 h-7 sm:h-8 text-white/80 shrink-0" />
        </Link>
      </div>

      {/* Two Column Layout: QuickCount Live Ranking + Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Quickcount Top 5 Preview */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Klasemen Sementara Top 5
            </h3>
            <Link to="/admin/quickcount" className="text-xs font-bold text-electric-600 dark:text-electric-400 hover:underline">
              Kelola Suara
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.top5 && data.top5.length > 0 ? (
              data.top5.map((c) => (
                <div
                  key={c.candidateId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60 text-xs gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-navy-700 font-black text-xs flex items-center justify-center shrink-0">
                      #{c.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-navy-900 dark:text-white truncate">
                        {c.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        No. {c.candidateNumber} • {c.position}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-navy-900 dark:text-white">
                      {c.votes} Suara
                    </span>
                    <p className="text-[10px] text-electric-600 dark:text-electric-400 font-bold">
                      {c.percentage}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada suara masuk.</p>
            )}
          </div>
        </div>

        {/* Recent Audit Trail Preview */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Catatan Integritas & Audit Terbaru
            </h3>
            <Link to="/admin/audit" className="text-xs font-bold text-electric-600 dark:text-electric-400 hover:underline">
              Lihat Seluruh Log
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div
                  key={log._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-navy-900 dark:text-white truncate">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Aktor: <strong>{log.actorName}</strong> ({log.actorRole})
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic truncate">
                    "{log.reason}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada audit log.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
