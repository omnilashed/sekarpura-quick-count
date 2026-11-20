import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Award, Lock, Play } from 'lucide-react';
import { electionService } from '../../services/electionService';
import { candidateService } from '../../services/candidateService';
import { Election, ElectionStage, Candidate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminElectionStagesPage: React.FC = () => {
  const [election, setElection] = useState<Election | null>(null);
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Promotion state
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [promotionNotes, setPromotionNotes] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const overview = await electionService.getOverview();
      setElection(overview.election);
      setStages(overview.stages);

      const candRes = await candidateService.getAll();
      setCandidates(candRes.data);

      // Pre-select top 2 candidates according to Schema 1 (Top 2 advance if no 50% + 1 winner)
      const defaultQualified = candRes.data.filter((c) => c.stage2Qualified).map((c) => c._id);
      if (defaultQualified.length > 0) {
        setSelectedCandidateIds(defaultQualified);
      } else {
        setSelectedCandidateIds(candRes.data.slice(0, 2).map((c) => c._id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStageStatusChange = async (stageId: string, status: any) => {
    setMessage(null);
    try {
      await electionService.updateStageStatus(stageId, { status });
      setMessage({ type: 'success', text: `Status tahap berhasil diubah menjadi ${status}!` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah status.' });
    }
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidateIds.length === 0) {
      setMessage({ type: 'error', text: 'Pilih minimal satu calon ketua untuk lolos ke Tahap 2.' });
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin menetapkan ${selectedCandidateIds.length} kandidat ini sebagai calon ketua definitif dan membuka QuickCount Tahap 2?`
      )
    ) {
      return;
    }

    setPromoting(true);
    setMessage(null);

    try {
      const res = await electionService.promoteToStage2(selectedCandidateIds, promotionNotes);
      setMessage({
        type: 'success',
        text: res.message || 'Calon definitif Tahap 2 berhasil ditetapkan dan QuickCount Tahap 2 aktif!',
      });
      loadData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menetapkan calon definitif.',
      });
    } finally {
      setPromoting(false);
    }
  };

  const toggleCandidateSelection = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((cId) => cId !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat konfigurasi tahapan...</div>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Manajemen Tahapan Pemilihan & Calon Definitif
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Kendalikan alur pemilihan dua tahap, kunci hasil rekapitulasi, dan tetapkan kandidat lolos ke Tahap 2
        </p>
      </div>

      {message && (
        <div
          className={`p-3 sm:p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Active Stage & Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {stages.map((stg) => {
          const isCurrentActive = election?.currentStage === stg.stageType;

          return (
            <div
              key={stg._id}
              className={`rounded-3xl p-4 xs:p-5 sm:p-8 border shadow-sm transition-all ${
                isCurrentActive
                  ? 'bg-white dark:bg-navy-900 border-electric-500 ring-2 ring-electric-500/20'
                  : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                  {stg.stageType === 'STAGE_1' ? 'TAHAP 1' : 'TAHAP 2'}
                </span>
                <StatusBadge status={stg.status} />
              </div>

              <h3 className="font-extrabold text-base sm:text-lg text-navy-900 dark:text-white mb-1">
                {stg.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 sm:mb-6">
                {stg.description}
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-navy-800">
                <div className="flex justify-between">
                  <span>Kandidat Terdaftar:</span>
                  <strong className="text-navy-900 dark:text-white">{stg.candidateIds?.length || 0} Calon</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Suara Masuk:</span>
                  <strong className="text-navy-900 dark:text-white">{stg.totalVotesIn || 0} Suara</strong>
                </div>
                <div className="flex justify-between">
                  <span>Sumber TPS Selesai:</span>
                  <strong className="text-navy-900 dark:text-white">
                    {stg.completedSourcesCount || 0} / {stg.targetSourcesCount || 0} TPS
                  </strong>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-4 sm:pt-6 flex flex-wrap gap-2">
                {stg.status !== 'COUNTING' && (
                  <button
                    onClick={() => handleStageStatusChange(stg._id, 'COUNTING')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Buka QuickCount</span>
                  </button>
                )}

                {stg.status === 'COUNTING' && (
                  <button
                    onClick={() => handleStageStatusChange(stg._id, 'COMPLETED')}
                    className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 min-h-[38px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tutup Rekap</span>
                  </button>
                )}

                {stg.status !== 'LOCKED' && (
                  <button
                    onClick={() => handleStageStatusChange(stg._id, 'LOCKED')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 min-h-[38px]"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kunci Hasil</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Promotion to Stage 2 Definitif Panel */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-gold-500/10 text-gold-500 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
              Penetapan Calon Ketua Definitif (Lolos Tahap 2)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih bakal calon yang lolos ke tahap definitif. Suara Tahap 2 dihitung dalam sesi quickcount baru yang bersih.
            </p>
          </div>
        </div>

        {/* Official Schema Rules Info Callout */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <span className="font-extrabold text-amber-500 text-sm">1.</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-navy-900 dark:text-white">Pemilihan Tahap 1:</strong> Jika salah satu calon tidak menerima surat suara dengan ketentuan <strong>≥ 50% + 1</strong> dari total suara seluruhnya, maka otomatis diambil <strong>2 calon peraih suara terbanyak</strong> untuk lanjut ke Tahap 2 Definitif.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-extrabold text-electric-500 text-sm">2.</span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-navy-900 dark:text-white">Pemilihan Tahap 2:</strong> Jika kedua calon mendapatkan suara sama imbang <strong>(50% : 50%)</strong>, maka otomatis ada penambahan <strong>1 suara penentu yang akan diambil oleh General Manager Bandara Halim PK</strong>.
            </p>
          </div>
        </div>

        <form onSubmit={handlePromoteSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {candidates.map((c) => {
              const isChecked = selectedCandidateIds.includes(c._id);
              return (
                <div
                  key={c._id}
                  onClick={() => toggleCandidateSelection(c._id)}
                  className={`p-3 sm:p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? 'border-gold-500 bg-gold-500/10 dark:bg-gold-500/15'
                      : 'border-slate-200 dark:border-navy-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 dark:bg-navy-800">
                      #{c.candidateNumber}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 text-gold-500 rounded"
                    />
                  </div>
                  <p className="font-extrabold text-xs text-navy-900 dark:text-white truncate">
                    {c.nickname}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{c.position}</p>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Catatan Keputusan Rapat Pleno Panitia
            </label>
            <input
              type="text"
              value={promotionNotes}
              onChange={(e) => setPromotionNotes(e.target.value)}
              placeholder="Contoh: Penetapan 5 Calon Definitif Berdasarkan Berita Acara Rapat Pleno No. 04/BA/PANITIA/2026..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
            />
          </div>

          <button
            type="submit"
            disabled={promoting || selectedCandidateIds.length === 0}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-gold-500 text-navy-950 font-black text-xs sm:text-sm shadow-lg shadow-gold-500/20 transition-all disabled:opacity-50 min-h-[44px]"
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>
              {promoting
                ? 'Menetapkan & Menginisialisasi Tahap 2...'
                : `Tetapkan ${selectedCandidateIds.length} Calon Definitif & Buka Tahap 2`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
