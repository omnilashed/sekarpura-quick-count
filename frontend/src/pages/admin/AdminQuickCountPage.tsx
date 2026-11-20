import React, { useEffect, useState, useRef } from 'react';
import {
  History,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap,
  Plus,
  Minus,
  Trophy,
  ShieldCheck,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { candidateService } from '../../services/candidateService';
import { VoteSource, Candidate, ElectionStage, QuickCountData } from '../../types';

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
  const [highlightForm, setHighlightForm] = useState<boolean>(false);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const correctionReasonRef = useRef<HTMLTextAreaElement>(null);

  // History modal
  const [historySource, setHistorySource] = useState<VoteSource | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // GM Tie-breaker state
  const [selectedGmCandidateId, setSelectedGmCandidateId] = useState<string>('');
  const [gmNotes, setGmNotes] = useState<string>('');
  const [submittingGm, setSubmittingGm] = useState<boolean>(false);

  // Round management states (Tahap 2 Definitive Election)
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [stageQuickCount, setStageQuickCount] = useState<QuickCountData | null>(null);
  const [processingRoundAction, setProcessingRoundAction] = useState<boolean>(false);
  const [resettingSourceId, setResettingSourceId] = useState<string | null>(null);
  const [resettingAll, setResettingAll] = useState<boolean>(false);

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

  const loadStageData = async (
    stageId: string,
    currentStages?: ElectionStage[],
    forcedRound?: number
  ) => {
    try {
      setLoading(true);
      const stageList = currentStages || stages;
      const stage = stageList.find((s) => s._id === stageId);
      const effectiveRound =
        forcedRound !== undefined ? forcedRound : stage?.activeRound || 1;
      setSelectedRound(effectiveRound);

      const [srcList, candList, qcData] = await Promise.all([
        quickcountService.getSources(stageId),
        candidateService.getAll(),
        quickcountService.getQuickCount(stageId, effectiveRound).catch(() => null),
      ]);
      setSources(srcList);
      setStageQuickCount(qcData);

      // Filter candidates for this stage & round
      let stageCandIds: string[] = [];
      if (
        stage?.stageType === 'STAGE_2' &&
        effectiveRound === 2 &&
        stage.round2CandidateIds &&
        stage.round2CandidateIds.length > 0
      ) {
        stageCandIds = stage.round2CandidateIds.map((c: any) =>
          typeof c === 'string' ? c : c._id
        );
      } else {
        stageCandIds =
          stage?.candidateIds?.map((c: any) => (typeof c === 'string' ? c : c._id)) || [];
      }

      const stageCandidates = candList.data.filter((c) =>
        stageCandIds.length > 0 ? stageCandIds.includes(c._id) : true
      );
      setCandidates(stageCandidates);

      // Pre-fill inputs from current quickcount rankings for this round if available
      const initialMap: Record<string, number> = {};
      stageCandidates.forEach((c) => {
        const existingRank = qcData?.rankings?.find((r) => r.candidateId === c._id);
        initialMap[c._id] = existingRank ? existingRank.votes : 0;
      });
      setVoteInputs(initialMap);
      setInvalidVotes(qcData?.invalidVotes || 0);

      if (srcList.length > 0) {
        setSelectedSourceId(srcList[0]._id);
      }
      setIsCorrectionMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When source selection changes or user clicks "Koreksi"
  const handleSourceSelect = (sourceId: string, isExplicitCorrection = false) => {
    setSelectedSourceId(sourceId);
    const source = sources.find((s) => s._id === sourceId);
    const isVerified = source?.status === 'VERIFIED';
    const activatingCorrection = isExplicitCorrection || isVerified;

    setIsCorrectionMode(activatingCorrection);

    const sub =
      source?.activeSubmissionId && typeof source.activeSubmissionId === 'object'
        ? (source.activeSubmissionId as any)
        : null;

    const map: Record<string, number> = {};

    if (sub && Array.isArray(sub.votes) && sub.votes.length > 0) {
      sub.votes.forEach((v: any) => {
        const cid =
          typeof v.candidateId === 'object' && v.candidateId !== null
            ? (v.candidateId._id || v.candidateId).toString()
            : String(v.candidateId);
        map[cid] = Number(v.count) || 0;
      });
      setInvalidVotes(Number(sub.invalidVotes) || 0);
      setNotes(sub.notes || '');
    } else {
      // Fallback to quickcount rankings for this round
      candidates.forEach((c) => {
        const existingRank = stageQuickCount?.rankings?.find((r) => r.candidateId === c._id);
        map[c._id] = existingRank ? existingRank.votes : 0;
      });
      setInvalidVotes(stageQuickCount?.invalidVotes || 0);
      setNotes('');
    }

    // Ensure all stage candidates are present in the map
    candidates.forEach((c) => {
      if (map[c._id] === undefined) {
        map[c._id] = 0;
      }
    });

    setVoteInputs(map);
    setCorrectionReason('');

    // Trigger visual highlight feedback
    setHighlightForm(true);
    setTimeout(() => setHighlightForm(false), 2500);

    if (activatingCorrection) {
      setMessage({
        type: 'success',
        text: `✏️ Mode Koreksi Aktif: TPS "${source?.sourceCode || ''} - ${source?.sourceName || ''}" siap diedit. Silakan ubah angka di formulir sebelah kiri, lengkapi alasan revisi di bawah, lalu simpan.`,
      });
    } else {
      setMessage({
        type: 'success',
        text: `TPS "${source?.sourceCode || ''}" dipilih. Formulir siap untuk input perolehan suara.`,
      });
    }

    // Smooth scroll to form section
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Calculate sum of candidate votes
  const validSum = Object.values(voteInputs).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalSum = validSum + (Number(invalidVotes) || 0);

  const selectedSource = sources.find((s) => s._id === selectedSourceId);
  const isSourceFinalSaved =
    Boolean(selectedRound === 1 ? stageQuickCount?.isRound1Saved : stageQuickCount?.isRound2Saved) ||
    Boolean((selectedSource?.activeSubmissionId as any)?.isFinalSaved);

  const isAlreadySubmitted =
    Boolean(selectedSource?.status === 'VERIFIED') ||
    Boolean(selectedSource?.activeSubmissionId) ||
    isSourceFinalSaved;

  const isRevisionRequired = isAlreadySubmitted || isCorrectionMode;

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
        round: selectedRound,
      });

      const candName = candidateId
        ? candidates.find((c) => c._id === candidateId)?.fullName || 'Calon'
        : 'Suara Tidak Sah';
      setTallyFeedback(
        `✓ ${delta > 0 ? '+1' : '-1'} untuk ${candName} tersiar live! (Total saat ini: ${res.submission.totalVotes} suara)`
      );
      setTimeout(() => setTallyFeedback(null), 3500);

      // Refresh sources and quick count in background
      quickcountService.getSources(selectedStageId).then(setSources);
      quickcountService.getQuickCount(selectedStageId, selectedRound).then(setStageQuickCount);
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

    // Jika TPS sudah pernah disimpan atau dalam mode koreksi, revisi/save ulang WAJIB mengisi alasan koreksi
    if (isRevisionRequired && (!correctionReason || correctionReason.trim().length < 5)) {
      setMessage({
        type: 'error',
        text: `Data suara Putaran ${selectedRound} untuk sumber ini sudah pernah dimasukkan. Silakan lengkapi kolom Alasan Revisi / Koreksi Suara (minimal 5 karakter) di bawah.`,
      });
      setIsCorrectionMode(true);
      setTimeout(() => {
        correctionReasonRef.current?.focus();
      }, 100);
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
      // Simpan resmi rekapitulasi ke database
      const res = await quickcountService.submitVotes({
        stageId: selectedStageId,
        sourceId: selectedSourceId,
        votes: voteItems,
        invalidVotes: Number(invalidVotes) || 0,
        totalVotes: totalSum,
        notes: notes.trim() || undefined,
        round: selectedRound,
        correctionReason: isRevisionRequired ? (correctionReason.trim() || undefined) : undefined,
      });

      setMessage({
        type: 'success',
        text: isRevisionRequired
          ? `Koreksi/revisi suara Putaran ${selectedRound} (${res.submission?.totalVotes || totalSum} suara) berhasil disimpan dan diaudit!`
          : `Hasil Rekapitulasi TPS Putaran ${selectedRound} (${res.submission?.totalVotes || totalSum} suara) berhasil disimpan secara resmi ke database!`,
      });
      setCorrectionReason('');

      await loadStageData(selectedStageId, stages, selectedRound);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Gagal menyimpan data suara resmi.';
      setMessage({
        type: 'error',
        text: errorMsg,
      });
      if (err.response?.status === 409 || err.response?.data?.needsCorrectionReason) {
        setIsCorrectionMode(true);
        setTimeout(() => {
          correctionReasonRef.current?.focus();
        }, 150);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Round Action Handlers for 2-Schema Tahap 2
  const handleSwitchRound = async (round: number) => {
    setSelectedRound(round);
    if (selectedStageId) {
      try {
        await electionService.switchRound(selectedStageId, round);
        const ov = await electionService.getOverview();
        setStages(ov.stages);
        await loadStageData(selectedStageId, ov.stages, round);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleAdvanceRound2 = async () => {
    if (!selectedStageId) return;
    if (
      !window.confirm(
        'Lanjut ke Putaran 2 (Skema 2: Head-to-Head 2 Calon Teratas)?\n\n' +
          'Sistem akan menyimpan hasil Putaran 1 secara permanen dan menyaring kandidat menjadi 2 calon peraih suara terbanyak untuk bertanding di Putaran 2.'
      )
    ) {
      return;
    }
    setProcessingRoundAction(true);
    try {
      const res = await electionService.advanceRound2(selectedStageId);
      setMessage({
        type: 'success',
        text: res.message || 'Berhasil lanjut ke Putaran 2 (Skema 2)!',
      });
      const ov = await electionService.getOverview();
      setStages(ov.stages);
      setSelectedRound(2);
      await loadStageData(selectedStageId, ov.stages, 2);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal lanjut ke Putaran 2.',
      });
    } finally {
      setProcessingRoundAction(false);
    }
  };

  const handleResetRound2 = async () => {
    if (!selectedStageId) return;
    if (
      !window.confirm(
        'Reset Putaran 2 kembali ke Putaran 1?\n\n' +
          'Perhatian: Suara yang diinput pada Putaran 2 akan dihapus/direset dan sistem kembali membuka Putaran 1.'
      )
    ) {
      return;
    }
    setProcessingRoundAction(true);
    try {
      const res = await electionService.resetRound2(selectedStageId);
      setMessage({
        type: 'success',
        text: res.message || 'Putaran 2 berhasil direset kembali ke Putaran 1.',
      });
      const ov = await electionService.getOverview();
      setStages(ov.stages);
      setSelectedRound(1);
      await loadStageData(selectedStageId, ov.stages, 1);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mereset Putaran 2.',
      });
    } finally {
      setProcessingRoundAction(false);
    }
  };

  const handleFinalizeRound2 = async () => {
    if (!selectedStageId) return;
    if (
      !window.confirm(
        'Tetapkan Pemenang Definitif dan Kunci Pemilihan Tahap 2?\n\n' +
          'Hasil Putaran 2 akan dikunci secara permanen dan calon dengan suara terbanyak (atau peraih suara penentu GM Halim) ditetapkan sebagai Ketua Definitif Sekarpura terpilih.'
      )
    ) {
      return;
    }
    setProcessingRoundAction(true);
    try {
      const res = await electionService.finalizeRound2(selectedStageId);
      setMessage({
        type: 'success',
        text: res.message || 'Tahap 2 berhasil diselesaikan & pemenang definitif ditetapkan!',
      });
      const ov = await electionService.getOverview();
      setStages(ov.stages);
      await loadStageData(selectedStageId, ov.stages, 2);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menetapkan pemenang definitif.',
      });
    } finally {
      setProcessingRoundAction(false);
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

  const handleResetSourceVotes = async (source: VoteSource) => {
    const confirmMsg =
      `⚠️ KONFIRMASI RESET RESMI DATA SUARA TPS\n\n` +
      `Apakah Anda yakin ingin mengosongkan / mereset data perolehan suara resmi untuk TPS:\n` +
      `• Kode TPS: ${source.sourceCode}\n` +
      `• Nama Sumber: ${source.sourceName}\n` +
      `• Putaran: ${selectedRound}\n\n` +
      `Perhatian Operasional:\n` +
      `1. Seluruh formulir surat suara yang tersimpan di database untuk TPS ini akan dihapus permanen.\n` +
      `2. Status TPS akan dikembalikan ke kondisi awal (Belum Masuk / 0 suara).\n` +
      `3. Tindakan ini merupakan prosedur administratif resmi dan akan dicatat dalam Log Audit sistem.\n\n` +
      `Lanjutkan proses reset resmi TPS ini?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setResettingSourceId(source._id);
    try {
      const res = await quickcountService.resetSourceVotes(source._id, selectedRound);
      setMessage({
        type: 'success',
        text: res.message || `Data suara resmi TPS ${source.sourceCode} berhasil direset ke 0.`,
      });
      setIsCorrectionMode(false);
      await loadStageData(selectedStageId, stages, selectedRound);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mereset data suara TPS.',
      });
    } finally {
      setResettingSourceId(null);
    }
  };

  const handleResetAllStageVotes = async () => {
    if (!selectedStageId) return;
    const confirmMsg =
      `⚠️ PERINGATAN KRITIS: RESET RESMI SELURUH REKAPITULASI TAHAP\n\n` +
      `Apakah Anda yakin ingin mengosongkan / mereset SELURUH data suara resmi pada tahapan ini?\n\n` +
      `Perhatian Operasional:\n` +
      `1. Seluruh formulir rekapitulasi dari SEMUA TPS pada tahapan ini akan dihapus permanen dari database.\n` +
      `2. Seluruh perolehan suara kandidat pada tahapan ini akan dikembalikan ke kondisi awal (0 suara).\n` +
      `3. Putaran dan status tahapan akan di-rollback ke awal perhitungan resmi.\n` +
      `4. Tindakan ini bersifat permanen dan dicatat dalam Log Audit resmi.\n\n` +
      `Apakah Anda benar-benar yakin ingin melanjutkan?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setResettingAll(true);
    try {
      const res = await quickcountService.resetStageVotes(selectedStageId, selectedRound);
      setMessage({
        type: 'success',
        text: res.message || 'Seluruh data suara resmi tahap ini berhasil direset kembali ke 0.',
      });
      setIsCorrectionMode(false);
      await loadStageData(selectedStageId, stages, selectedRound);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mereset seluruh data suara tahap ini.',
      });
    } finally {
      setResettingAll(false);
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

      {/* Definitive Stage Round Switcher & Schema Flow Controller */}
      {isStage2 && (
        <div className="bg-white dark:bg-navy-900 border-2 border-slate-200 dark:border-navy-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/20">
                  Tahap 2: Pemilihan Calon Ketua Definitif
                </span>
                {currentStage?.round2Completed ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                    🏆 Pemenang Definitif Terpilih
                  </span>
                ) : currentStage?.activeRound === 2 ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30 animate-pulse">
                    🗳️ Putaran 2 Aktif
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">
                    🗳️ Putaran 1 Aktif
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Tata Tertib 2 Putaran / 2 Skema Pemilihan Definitif
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Putaran 1 (Skema 1: Syarat Mutlak ≥ 50% + 1) • Putaran 2 (Skema 2: Head-to-Head 2 Calon Teratas + 1 Suara GM Halim jika 50%-50%)
              </p>
            </div>

            {/* Switch Round Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchRound(1)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedRound === 1
                    ? 'bg-electric-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
                }`}
              >
                <span>Putaran 1 (Skema 1)</span>
                {currentStage?.round1Completed && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                    ✓ Selesai
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchRound(2)}
                disabled={!currentStage?.round1Completed && currentStage?.activeRound !== 2}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedRound === 2
                    ? 'bg-electric-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed'
                }`}
              >
                <span>Putaran 2 (Skema 2)</span>
                {currentStage?.round2Completed ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                    🏆 Final
                  </span>
                ) : (
                  currentStage?.round1Completed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold">
                      Aktif
                    </span>
                  )
                )}
              </button>
            </div>
          </div>

          {/* Contextual Status / Action Callout */}
          {selectedRound === 1 ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-navy-900 dark:text-white">
                  Status Putaran 1 (Skema 1: Syarat Mutlak ≥ 50% + 1)
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Target total: <strong>{targetVotes} suara</strong>. Syarat menang mutlak: minimal{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {Math.floor(targetVotes / 2) + 1} suara
                  </strong>.
                  {stageQuickCount?.schemaRules?.stage2Definitive?.skema1?.hasWinner50Plus1 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                      ✓ Calon telah mencapai syarat mutlak: {stageQuickCount.schemaRules.stage2Definitive.skema1.winnerName}
                    </span>
                  ) : (
                    <span className="ml-1">
                      {totalSum >= targetVotes
                        ? 'Semua suara telah masuk dan belum ada calon yang mencapai syarat mutlak 50% + 1.'
                        : `Saat ini telah masuk ${totalSum} dari ${targetVotes} suara.`}
                    </span>
                  )}
                </p>
              </div>

              {/* Action Button: Advance to Round 2 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                {totalSum >= targetVotes && !stageQuickCount?.schemaRules?.stage2Definitive?.skema1?.hasWinner50Plus1 && (
                  isSourceFinalSaved ? (
                    <button
                      type="button"
                      onClick={handleAdvanceRound2}
                      disabled={processingRoundAction}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-navy-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <span>👉 Lanjut ke Putaran 2 (Skema 2: Head-to-Head)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-2 rounded-xl">
                      ⚠️ Simpan hasil rekap TPS di formulir bawah untuk meresmikan Putaran 1 & membuka Putaran 2
                    </span>
                  )
                )}
                {currentStage?.round1Completed && (
                  <button
                    type="button"
                    onClick={() => handleSwitchRound(2)}
                    className="px-3.5 py-2.5 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Buka Putaran 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-electric-500/10 via-amber-500/10 to-transparent border border-electric-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-navy-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  <span>Status Putaran 2 (Skema 2: Head-to-Head 2 Calon Teratas)</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Hanya 2 calon teratas dari Putaran 1 yang bertanding. Apabila hasil akhir seri{' '}
                  <strong className="text-electric-600 dark:text-electric-400">50% : 50%</strong>, General Manager Bandara Halim PK memberikan 1 suara penentu.
                </p>
                {stageQuickCount?.schemaRules?.round1Summary && (
                  <p className="text-[11px] text-slate-400 italic">
                    Riwayat Putaran 1: {stageQuickCount.schemaRules.round1Summary.top2Candidates?.map((c) => `${c.fullName} (${c.votes} suara)`).join(' vs ')}
                  </p>
                )}
              </div>

              {/* Action Buttons for Round 2 */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetRound2}
                  disabled={processingRoundAction}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-50"
                  title="Kembali ke Putaran 1 dan hapus suara Putaran 2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Putaran 1</span>
                </button>

                {!currentStage?.round2Completed && (
                  totalSum >= targetVotes && !isSourceFinalSaved ? (
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-2 rounded-xl">
                      ⚠️ Simpan hasil rekap Putaran 2 di bawah untuk menetapkan pemenang definitif
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinalizeRound2}
                      disabled={processingRoundAction || totalSum < targetVotes || !isSourceFinalSaved}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Tetapkan Pemenang Definitif</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Data Entry Form on Left + Sources Status Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Form Input Suara (7 Cols) */}
        <div
          ref={formSectionRef}
          className={`lg:col-span-7 bg-white dark:bg-navy-900 border rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6 transition-all duration-500 ${
            highlightForm
              ? 'ring-4 ring-amber-500 border-amber-500 shadow-2xl scale-[1.01]'
              : isCorrectionMode
              ? 'border-amber-500/70 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-navy-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-4 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                {isCorrectionMode ? 'Panel Hitung & Koreksi Suara TPS' : 'Panel Input & Hitung Suara TPS'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCorrectionMode
                  ? 'Sedang dalam mode koreksi. Sesuaikan perolehan suara calon lalu simpan revisi resmi.'
                  : 'Pilih TPS, lalu klik +1 Live saat surat suara dibacakan.'}
              </p>
            </div>
            {isCorrectionMode ? (
              <span className="px-3 py-1 rounded-full bg-amber-500 text-navy-950 font-black text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-sm animate-pulse">
                <span>✏️ Mode Koreksi Aktif</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider shrink-0">
                Mode Input Siap
              </span>
            )}
          </div>

          {/* Banner Active Correction */}
          {isCorrectionMode && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode Koreksi TPS Aktif</strong>: Anda sedang mengoreksi formulir{' '}
                  <strong>{selectedSource?.sourceCode}</strong> ({selectedSource?.sourceName}).
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCorrectionMode(false);
                  setMessage(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] hover:bg-slate-100 shrink-0 border border-slate-200 dark:border-navy-700 self-end sm:self-auto"
              >
                Batal Koreksi
              </button>
            </div>
          )}

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

            {/* Revision Callout & Mandatory Reason (When in correction mode or already submitted) */}
            {isRevisionRequired && (
              <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="font-bold text-xs sm:text-sm">
                    {isAlreadySubmitted
                      ? `Status TPS: Data Suara Putaran ${selectedRound} Sudah Pernah Disimpan Resmi`
                      : `Mode Koreksi Suara TPS Aktif`}
                  </p>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Menyimpan perubahan (koreksi / save ulang) akan dicatat sebagai <strong>Revisi Resmi</strong> baru dalam audit trail. Wajib mengisi kolom alasan koreksi/revisi di bawah ini:
                </p>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1 text-amber-800 dark:text-amber-300">
                    Alasan Revisi / Koreksi Suara (Wajib Diisi) *
                  </label>
                  <textarea
                    ref={correctionReasonRef}
                    rows={2}
                    required
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Contoh: Koreksi hitung surat suara calon nomor 3 setelah verifikasi ulang bersama saksi forum..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-900 border-2 border-amber-500 text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedSourceId}
              className={`w-full py-3 sm:py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2 ${
                isRevisionRequired
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-electric-600 hover:bg-electric-500 shadow-electric-600/20'
              }`}
            >
              {submitting ? (
                'Menyimpan Data...'
              ) : isRevisionRequired ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>📝 Simpan Koreksi / Revisi Resmi Suara Putaran {selectedRound}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>💾 Simpan & Kunci Hasil Rekapitulasi TPS Putaran {selectedRound} (Resmi)</span>
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
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                  Daftar Sumber TPS ({sources.length})
                </h3>
                <span className="text-[11px] text-slate-400">
                  {sources.filter((s) => s.status === 'VERIFIED').length} Selesai Diverifikasi
                </span>
              </div>
              {sources.some((s) => s.status === 'VERIFIED' || s.activeSubmissionId) && (
                <button
                  type="button"
                  onClick={handleResetAllStageVotes}
                  disabled={resettingAll}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all self-start xs:self-auto disabled:opacity-50 border border-rose-500/20"
                  title="Reset Resmi Seluruh Data Suara TPS pada Tahap Ini"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resettingAll ? 'animate-spin' : ''}`} />
                  <span>{resettingAll ? 'Mereset...' : 'Reset Semua Suara'}</span>
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-1">
              {sources.map((src) => (
                <div
                  key={src._id}
                  className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-all ${
                    selectedSourceId === src._id
                      ? isCorrectionMode
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/40 shadow-sm'
                        : 'bg-electric-500/10 border-electric-500 ring-2 ring-electric-500/40 shadow-sm'
                      : src.status === 'VERIFIED'
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
                      {selectedSourceId === src._id && isCorrectionMode && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-navy-950">
                          Sedang Dikoreksi
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {src.sourceName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSourceSelect(src._id, src.status === 'VERIFIED')}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] min-h-[34px] transition-all flex items-center gap-1.5 ${
                        selectedSourceId === src._id && isCorrectionMode
                          ? 'bg-amber-500 hover:bg-amber-400 text-navy-950 font-black shadow-md ring-2 ring-amber-400'
                          : 'bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400'
                      }`}
                    >
                      <span>
                        {selectedSourceId === src._id && isCorrectionMode
                          ? '✏️ Sedang Dikoreksi'
                          : src.status === 'VERIFIED'
                          ? '✏️ Koreksi'
                          : '➕ Input'}
                      </span>
                    </button>
                    {src.status === 'VERIFIED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenHistory(src)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors"
                        title="Riwayat Revisi"
                        aria-label="Riwayat Revisi"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(src.status === 'VERIFIED' || src.activeSubmissionId) && (
                      <button
                        type="button"
                        onClick={() => handleResetSourceVotes(src)}
                        disabled={resettingSourceId === src._id}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 min-h-[34px] min-w-[34px] flex items-center justify-center transition-colors disabled:opacity-50 border border-rose-500/20"
                        title="Reset Resmi Data Suara TPS Ini"
                        aria-label="Reset Resmi Data Suara TPS"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${resettingSourceId === src._id ? 'animate-spin' : ''}`} />
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
