import React, { useEffect, useState } from 'react';
import {
  History,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { candidateService } from '../../services/candidateService';
import { VoteSource, Candidate, ElectionStage } from '../../types';

export const AdminQuickCountPage: React.FC = () => {
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [sources, setSources] = useState<VoteSource[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [, setLoading] = useState(true);

  // Form states
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [voteInputs, setVoteInputs] = useState<Record<string, number>>({});
  const [invalidVotes, setInvalidVotes] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isCorrectionMode, setIsCorrectionMode] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // History modal
  const [historySource, setHistorySource] = useState<VoteSource | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    if (selectedStageId) {
      loadStageData(selectedStageId);
    }
  }, [selectedStageId]);

  const loadStages = async () => {
    try {
      const data = await electionService.getStages();
      setStages(data);
      if (data.length > 0) {
        setSelectedStageId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStageData = async (stageId: string) => {
    try {
      setLoading(true);
      const [srcList, candList] = await Promise.all([
        quickcountService.getSources(stageId),
        candidateService.getAll(),
      ]);
      setSources(srcList);

      // Filter candidates for this stage
      const stage = stages.find((s) => s._id === stageId);
      const stageCandIds = stage?.candidateIds?.map((c: any) => (typeof c === 'string' ? c : c._id)) || [];
      const stageCandidates = candList.data.filter((c) =>
        stageCandIds.length > 0 ? stageCandIds.includes(c._id) : true
      );
      setCandidates(stageCandidates);

      // Initialize inputs
      const initialMap: Record<string, number> = {};
      stageCandidates.forEach((c) => {
        initialMap[c._id] = 0;
      });
      setVoteInputs(initialMap);
      setInvalidVotes(0);
      setSelectedSourceId('');
      setIsCorrectionMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When source selection changes
  const handleSourceSelect = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setMessage(null);
    const source = sources.find((s) => s._id === sourceId);

    if (source && source.status === 'VERIFIED' && source.activeSubmissionId) {
      // Switch to correction mode
      setIsCorrectionMode(true);
      const sub = source.activeSubmissionId;
      const map: Record<string, number> = {};
      sub.votes?.forEach((v: any) => {
        map[v.candidateId] = v.count;
      });
      setVoteInputs(map);
      setInvalidVotes(sub.invalidVotes || 0);
      setNotes(sub.notes || '');
      setCorrectionReason('');
    } else {
      setIsCorrectionMode(false);
      const initialMap: Record<string, number> = {};
      candidates.forEach((c) => {
        initialMap[c._id] = 0;
      });
      setVoteInputs(initialMap);
      setInvalidVotes(0);
      setNotes('');
      setCorrectionReason('');
    }
  };

  // Calculate sum of candidate votes
  const validSum = Object.values(voteInputs).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalSum = validSum + (Number(invalidVotes) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceId || !selectedStageId) {
      setMessage({ type: 'error', text: 'Pilih sumber suara / TPS terlebih dahulu.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const voteItems = candidates.map((c) => ({
      candidateId: c._id,
      candidateNumber: c.candidateNumber,
      count: Number(voteInputs[c._id]) || 0,
    }));

    try {
      if (isCorrectionMode) {
        // Correct Votes
        if (!correctionReason || correctionReason.trim().length < 5) {
          setMessage({
            type: 'error',
            text: 'Alasan koreksi wajib diisi minimal 5 karakter untuk keperluan kepatuhan audit.',
          });
          setSubmitting(false);
          return;
        }

        const res = await quickcountService.correctVotes({
          stageId: selectedStageId,
          sourceId: selectedSourceId,
          votes: voteItems,
          invalidVotes: Number(invalidVotes) || 0,
          totalVotes: totalSum,
          correctionReason,
          notes,
        });

        setMessage({
          type: 'success',
          text: res.message || 'Koreksi data suara berhasil disiarkan secara real-time!',
        });
      } else {
        // Submit New Votes
        const res = await quickcountService.submitVotes({
          stageId: selectedStageId,
          sourceId: selectedSourceId,
          votes: voteItems,
          invalidVotes: Number(invalidVotes) || 0,
          totalVotes: totalSum,
          notes,
        });

        setMessage({
          type: 'success',
          text: res.message || 'Data suara berhasil diverifikasi dan disiarkan secara real-time!',
        });
      }

      loadStageData(selectedStageId);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan data suara.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHistory = async (source: VoteSource) => {
    setHistorySource(source);
    try {
      const history = await quickcountService.getHistory(source._id);
      setHistoryData(history);
      setShowHistoryModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            QuickCount Control Center & Rekapitulasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Input data suara resmi per TPS, validasi integritas total, dan koreksi dengan audit trail
          </p>
        </div>

        {/* Stage Selector */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 bg-white dark:bg-navy-900 p-1.5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm w-full sm:w-auto">
          {stages.map((stg) => (
            <button
              key={stg._id}
              onClick={() => setSelectedStageId(stg._id)}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[38px] flex items-center justify-center ${
                selectedStageId === stg._id
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              {stg.stageType === 'STAGE_1' ? 'Tahap 1 (Bakal Calon)' : 'Tahap 2 (Definitif)'}
            </button>
          ))}
        </div>
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

      {/* Main Grid: Data Entry Form on Left + Sources Status Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Form Input Suara (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-4 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                {isCorrectionMode ? 'Formulir Koreksi Suara TPS' : 'Formulir Input Suara TPS'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCorrectionMode
                  ? 'Koreksi rekapitulasi terverifikasi (memerlukan alasan revisi)'
                  : 'Masukkan data suara dari Berita Acara resmi TPS'}
              </p>
            </div>
            {isCorrectionMode && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 font-black text-[10px] uppercase tracking-wider shrink-0">
                Mode Koreksi
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Select TPS */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Pilih Sumber Suara / TPS
              </label>
              <select
                required
                value={selectedSourceId}
                onChange={(e) => handleSourceSelect(e.target.value)}
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
              >
                <option value="">-- Pilih TPS / Unit Kerja --</option>
                {sources.map((src) => (
                  <option key={src._id} value={src._id}>
                    {src.sourceCode} - {src.sourceName} ({src.status === 'VERIFIED' ? 'Sudah Ada Rekap' : 'Belum Masuk'})
                  </option>
                ))}
              </select>
            </div>

            {/* Candidate Vote Inputs Grid */}
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Rincian Perolehan Suara Calon
              </label>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3 max-h-[360px] overflow-y-auto pr-1">
                {candidates.map((cand) => (
                  <div
                    key={cand._id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                        No. {cand.candidateNumber}
                      </span>
                      <p className="font-extrabold text-xs text-navy-900 dark:text-white truncate mt-1">
                        {cand.nickname}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{cand.workUnit}</p>
                    </div>

                    <div className="w-20 sm:w-24 shrink-0">
                      <input
                        type="number"
                        min="0"
                        required
                        value={voteInputs[cand._id] ?? 0}
                        onChange={(e) =>
                          setVoteInputs({
                            ...voteInputs,
                            [cand._id]: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full text-right px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 font-extrabold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[38px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invalid Votes Input */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Jumlah Suara Tidak Sah / Rusak
              </label>
              <input
                type="number"
                min="0"
                required
                value={invalidVotes}
                onChange={(e) => setInvalidVotes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
              />
            </div>

            {/* Total Integrity Summary Box */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs flex items-center justify-between gap-3">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Total Akumulasi Suara Masuk</p>
                <p className="text-lg sm:text-xl font-black text-navy-900 dark:text-white mt-0.5">
                  {totalSum} Suara
                </p>
              </div>
              <div className="text-right text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                <p>Sah: <strong className="text-emerald-500">{validSum}</strong></p>
                <p>Tidak Sah: <strong className="text-rose-500">{invalidVotes}</strong></p>
              </div>
            </div>

            {/* Mandatory Correction Reason if Mode is Correction */}
            {isCorrectionMode && (
              <div>
                <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Alasan Koreksi / Revisi Berita Acara (Wajib untuk Audit) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Contoh: Koreksi formulir hasil perhitungan ulang saksi TPS..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Catatan Petugas / Saksi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Disaksikan saksi Paslon 1 & Paslon 2..."
                className="w-full px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs min-h-[40px]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSourceId}
              className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center ${
                isCorrectionMode
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-electric-600 hover:bg-electric-500 shadow-electric-600/20'
              }`}
            >
              {submitting
                ? 'Memproses & Menyiarkan...'
                : isCorrectionMode
                ? 'Simpan Koreksi Suara (Kirim Realtime)'
                : 'Verifikasi & Siarkan Suara Resmi TPS'}
            </button>
          </form>
        </div>

        {/* Status TPS & Reports Export (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Export Report Card */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Ekspor Rekapitulasi Resmi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unduh rekapitulasi data suara tahap ini dalam format dokumen resmi
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 sm:pt-2">
              <button
                onClick={() => quickcountService.downloadReport(selectedStageId, 'pdf')}
                className="flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-xs transition-colors min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => quickcountService.downloadReport(selectedStageId, 'xlsx')}
                className="flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-xs transition-colors min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => quickcountService.downloadReport(selectedStageId, 'csv')}
                className="flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 font-bold text-xs transition-colors min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* TPS List Status */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                Daftar Sumber TPS ({sources.length})
              </h3>
              <span className="text-xs text-slate-400">
                {sources.filter((s) => s.status === 'VERIFIED').length} Selesai
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-1">
              {sources.map((src) => (
                <div
                  key={src._id}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                    src.status === 'VERIFIED'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-slate-50 dark:bg-navy-800/40 border-slate-200 dark:border-navy-700/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-navy-900 dark:text-white">
                        {src.sourceCode}
                      </span>
                      {src.status === 'VERIFIED' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {src.sourceName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleSourceSelect(src._id)}
                      className="px-2.5 py-1.5 rounded-lg bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400 font-bold text-[11px] min-h-[34px]"
                    >
                      {src.status === 'VERIFIED' ? 'Koreksi' : 'Input'}
                    </button>
                    {src.status === 'VERIFIED' && (
                      <button
                        onClick={() => handleOpenHistory(src)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Riwayat Revisi"
                        aria-label="Riwayat Revisi"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Revision History Modal */}
      {showHistoryModal && historySource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white mb-1">
              Riwayat Revisi: {historySource.sourceCode}
            </h2>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">{historySource.sourceName}</p>

            <div className="space-y-3 sm:space-y-4">
              {historyData.map((item) => (
                <div
                  key={item._id}
                  className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>Revisi #{item.revision}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.verifiedAt || item.createdAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Total Suara: <strong className="text-navy-900 dark:text-white">{item.totalVotes}</strong> (Sah: {item.totalVotes - item.invalidVotes}, Tidak Sah: {item.invalidVotes})
                  </p>
                  {item.correctionReason && (
                    <p className="text-amber-600 dark:text-amber-400 italic">
                      Alasan: "{item.correctionReason}"
                    </p>
                  )}
                  {item.submittedBy?.name && (
                    <p className="text-[10px] text-slate-400">
                      Petugas: {item.submittedBy.name}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-navy-800 text-slate-700 dark:text-slate-200 font-bold text-xs min-h-[40px]"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
