import React, { useEffect, useState } from 'react';
import {
  History,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
  Plus,
  Minus,
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

  // GM Tie-breaker state
  const [selectedGmCandidateId, setSelectedGmCandidateId] = useState<string>('');
  const [gmNotes, setGmNotes] = useState<string>('');
  const [submittingGm, setSubmittingGm] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tallyFeedback, setTallyFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    try {
      const overview = await electionService.getOverview();
      const stageList = overview.stages;
      setStages(stageList);

      const activeId =
        (typeof overview.election?.activeStageId === 'object'
          ? (overview.election.activeStageId as any)?._id
          : overview.election?.activeStageId) ||
        stageList.find((s) => s.stageType === overview.election?.currentStage)?._id ||
        stageList[0]?._id;

      if (activeId) {
        setSelectedStageId(activeId);
        loadStageData(activeId, stageList);
      }
    } catch (err) {
      console.error(err);
      electionService.getStages().then((data) => {
        setStages(data);
        if (data.length > 0) {
          setSelectedStageId(data[0]._id);
          loadStageData(data[0]._id, data);
        }
      });
    }
  };

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
    loadStageData(stageId, stages);
  };

  const loadStageData = async (stageId: string, currentStages?: ElectionStage[]) => {
    try {
      setLoading(true);
      const [srcList, candList] = await Promise.all([
        quickcountService.getSources(stageId),
        candidateService.getAll(),
      ]);
      setSources(srcList);

      // Filter candidates for this stage
      const stageList = currentStages || stages;
      const stage = stageList.find((s) => s._id === stageId);
      const stageCandIds = stage?.candidateIds?.map((c: any) => (typeof c === 'string' ? c : c._id)) || [];

      // If stage has specific candidateIds registered, filter strictly by them
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

  // Quick live tally (+1 / -1 per surat suara tanpa syarat simpan atau alasan revisi)
  const handleQuickTally = async (candidateId: string | null, delta: number, isInvalid = false) => {
    if (!selectedSourceId || !selectedStageId) {
      setMessage({ type: 'error', text: 'Pilih sumber suara / TPS terlebih dahulu di atas.' });
      return;
    }

    // Optimistic UI update
    if (isInvalid) {
      setInvalidVotes((prev) => Math.max(0, prev + delta));
    } else if (candidateId) {
      setVoteInputs((prev) => ({
        ...prev,
        [candidateId]: Math.max(0, (prev[candidateId] || 0) + delta),
      }));
    }

    try {
      const res = await quickcountService.liveTally({
        stageId: selectedStageId,
        sourceId: selectedSourceId,
        candidateId: candidateId || undefined,
        isInvalidVote: isInvalid,
        delta,
      });

      const candName = candidateId
        ? candidates.find((c) => c._id === candidateId)?.fullName || 'Calon'
        : 'Suara Tidak Sah';
      setTallyFeedback(
        `✓ ${delta > 0 ? '+1' : '-1'} untuk ${candName} tersiar live! (Total saat ini: ${res.submission.totalVotes} suara)`
      );
      setTimeout(() => setTallyFeedback(null), 3500);

      // Refresh sources in background to update status to VERIFIED
      quickcountService.getSources(selectedStageId).then(setSources);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengirim live tally suara.',
      });
    }
  };

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
      // Use liveTally directly: updates or creates without throwing revision/conflict errors
      const res = await quickcountService.liveTally({
        stageId: selectedStageId,
        sourceId: selectedSourceId,
        votes: voteItems,
        invalidVotes: Number(invalidVotes) || 0,
      });

      setMessage({
        type: 'success',
        text: `Data suara (${res.submission.totalVotes} suara) berhasil disimpan & disiarkan secara real-time!`,
      });

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

  const handleCastGmTieBreaker = async () => {
    if (!selectedGmCandidateId || !selectedStageId) return;
    const cand = candidates.find((c) => c._id === selectedGmCandidateId);
    if (
      !window.confirm(
        `Apakah Anda yakin ingin memberikan 1 Suara Penentu General Manager Bandara Halim PK kepada ${
          cand?.fullName || 'calon ini'
        }?`
      )
    ) {
      return;
    }
    setSubmittingGm(true);
    try {
      const res = await electionService.castGmTieBreaker(
        selectedStageId,
        selectedGmCandidateId,
        gmNotes
      );
      setMessage({
        type: 'success',
        text: res.message || 'Suara penentu GM Halim PK berhasil diterapkan!',
      });
      const ov = await electionService.getOverview();
      setStages(ov.stages);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menerapkan suara penentu GM.',
      });
    } finally {
      setSubmittingGm(false);
    }
  };

  const handleResetGmTieBreaker = async () => {
    if (!selectedStageId) return;
    if (!window.confirm('Apakah Anda yakin ingin membatalkan/reset suara penentu GM Halim PK?')) {
      return;
    }
    setSubmittingGm(true);
    try {
      const res = await electionService.resetGmTieBreaker(selectedStageId);
      setMessage({
        type: 'success',
        text: res.message || 'Suara penentu GM Halim PK berhasil direset.',
      });
      const ov = await electionService.getOverview();
      setStages(ov.stages);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mereset suara penentu GM.',
      });
    } finally {
      setSubmittingGm(false);
    }
  };

  const currentStage = stages.find((s) => s._id === selectedStageId);
  const isStage2 = currentStage?.stageType === 'STAGE_2';
  const targetVotes = currentStage?.targetVotes || (isStage2 ? 25 : 102);

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
              onClick={() => handleStageSelect(stg._id)}
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
                {isCorrectionMode ? 'Panel Hitung & Koreksi Suara TPS' : 'Panel Input & Hitung Suara TPS'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih TPS, lalu klik <span className="font-bold text-emerald-600">+1 Live</span> saat surat suara dibacakan
              </p>
            </div>
            {isCorrectionMode && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-wider shrink-0">
                Mode Siap Hitung
              </span>
            )}
          </div>

          {/* Live Tally Quick Helper */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-electric-500/10 to-transparent border border-emerald-500/30 flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-extrabold text-navy-900 dark:text-white">
                Mode Hitung Cepat per Surat Suara (Live Tally)
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Cukup klik tombol hijau <strong>+1 Live</strong> pada calon saat surat suara dibuka di forum. Suara otomatis bertambah dan langsung tayang real-time di beranda tanpa perlu klik tombol simpan atau isi alasan revisi!
              </p>
            </div>
          </div>

          {tallyFeedback && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{tallyFeedback}</span>
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Perolehan Suara Calon (Klik +1 untuk Tambah Langsung)
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  Target: {targetVotes} Pemilih
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:gap-3 max-h-[380px] overflow-y-auto pr-1">
                {candidates.map((cand) => (
                  <div
                    key={cand._id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700 flex items-center justify-between gap-2 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                        No. {cand.candidateNumber}
                      </span>
                      <p className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white truncate mt-1">
                        {cand.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{cand.workUnit}</p>
                    </div>

                    {/* Quick Tally Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickTally(cand._id, -1)}
                        disabled={!selectedSourceId || (voteInputs[cand._id] || 0) <= 0}
                        title="Kurangi 1 suara (-1)"
                        className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-navy-700 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center transition-all disabled:opacity-30 min-h-[32px]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

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
                        className="w-14 text-center px-1.5 py-1.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 font-extrabold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[36px]"
                      />

                      <button
                        type="button"
                        onClick={() => handleQuickTally(cand._id, 1)}
                        disabled={!selectedSourceId}
                        title="Tambah 1 suara (+1 langsung live!)"
                        className="px-3 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-40 min-h-[32px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>1 Live</span>
                      </button>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickTally(null, -1, true)}
                  disabled={!selectedSourceId || invalidVotes <= 0}
                  title="Kurangi suara tidak sah (-1)"
                  className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-navy-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center disabled:opacity-30 min-h-[36px]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="0"
                  required
                  value={invalidVotes}
                  onChange={(e) => setInvalidVotes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 text-center px-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm font-bold min-h-[38px]"
                />
                <button
                  type="button"
                  onClick={() => handleQuickTally(null, 1, true)}
                  disabled={!selectedSourceId}
                  title="Tambah suara tidak sah (+1)"
                  className="px-3.5 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-rose-600/20 disabled:opacity-40 min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>1 Tidak Sah</span>
                </button>
              </div>
            </div>

            {/* Total Integrity Summary Box */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs flex items-center justify-between gap-3">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Total Surat Suara Terhitung</p>
                <p className="text-lg sm:text-xl font-black text-navy-900 dark:text-white mt-0.5">
                  {totalSum}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {targetVotes} Suara ({Math.max(0, targetVotes - totalSum)} tersisa)
                  </span>
                </p>
              </div>
              <div className="text-right text-[10px] sm:text-[11px] text-slate-400 shrink-0">
                <p>Sah: <strong className="text-emerald-500 font-bold">{validSum}</strong></p>
                <p>Tidak Sah: <strong className="text-rose-500 font-bold">{invalidVotes}</strong></p>
              </div>
            </div>

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
              className="w-full py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg bg-electric-600 hover:bg-electric-500 shadow-electric-600/20 transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Menyinkronkan...'
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Simpan & Sinkronkan Semua Angka (Kirim Realtime)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status TPS & Reports Export (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          {/* Hak 1 Suara Penentu GM Halim PK Card (Tahap 2 Definitif) */}
          {isStage2 && (
            <div className="bg-gradient-to-br from-white via-white to-amber-50/50 dark:from-navy-900 dark:via-navy-900 dark:to-navy-950 border-2 border-amber-500/40 dark:border-amber-500/50 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm">
                    ⚖️
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                    Suara Penentu GM Halim PK
                  </h3>
                </div>
                {currentStage?.isTieBreakerActive && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    SUDAH DIGUNAKAN
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sesuai Ketentuan Tahap 2: Jika kedua calon memperoleh suara sama imbang{' '}
                <strong>(50% : 50%)</strong>, otomatis ada tambahan 1 suara penentu yang diambil oleh{' '}
                <strong>General Manager Bandara Halim Perdanakusuma</strong>.
              </p>

              {currentStage?.isTieBreakerActive ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                  <p className="font-bold">
                    ✓ Suara Penentu GM Halim telah diberikan kepada:{' '}
                    <span className="text-navy-900 dark:text-white underline">
                      {candidates.find((c) => c._id === currentStage.tieBreakerCandidateId)?.fullName ||
                        'Calon Terpilih'}
                    </span>
                  </p>
                  {currentStage.tieBreakerNotes && (
                    <p className="text-[11px] opacity-80 italic">"{currentStage.tieBreakerNotes}"</p>
                  )}
                  <button
                    type="button"
                    onClick={handleResetGmTieBreaker}
                    disabled={submittingGm}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 underline pt-1 block"
                  >
                    Reset / Batalkan Suara Penentu GM
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Pilih Calon Penerima +1 Suara Penentu GM:
                  </label>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {candidates.map((cand) => (
                      <label
                        key={cand._id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedGmCandidateId === cand._id
                            ? 'bg-amber-500/10 border-amber-500 font-bold text-navy-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-navy-800/60 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gmCandidate"
                          value={cand._id}
                          checked={selectedGmCandidateId === cand._id}
                          onChange={() => setSelectedGmCandidateId(cand._id)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-navy-700 font-bold">
                          No. {cand.candidateNumber}
                        </span>
                        <span className="truncate">{cand.fullName}</span>
                      </label>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Catatan penetapan GM Halim PK (opsional)"
                    value={gmNotes}
                    onChange={(e) => setGmNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900"
                  />

                  <button
                    type="button"
                    onClick={handleCastGmTieBreaker}
                    disabled={!selectedGmCandidateId || submittingGm}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all"
                  >
                    {submittingGm ? 'Menerapkan Suara...' : 'Terapkan 1 Suara Penentu GM Halim PK'}
                  </button>
                </div>
              )}
            </div>
          )}

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
