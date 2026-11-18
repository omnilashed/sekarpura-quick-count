import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, Edit2, Trash2, X } from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { VoteSource, ElectionStage } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminVoteSourcesPage: React.FC = () => {
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [sources, setSources] = useState<VoteSource[]>([]);
  const [, setLoading] = useState(true);

  // New source form modal
  const [showModal, setShowModal] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [workUnit, setWorkUnit] = useState('');
  const [location, setLocation] = useState('');
  const [targetVoters, setTargetVoters] = useState(100);

  // Edit source modal
  const [editSource, setEditSource] = useState<VoteSource | null>(null);
  const [editSourceCode, setEditSourceCode] = useState('');
  const [editSourceName, setEditSourceName] = useState('');
  const [editWorkUnit, setEditWorkUnit] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTargetVoters, setEditTargetVoters] = useState(100);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadOverviewAndStages();
  }, []);

  const loadOverviewAndStages = async () => {
    try {
      const overview = await electionService.getOverview();
      setStages(overview.stages);

      // Default to active stage, not always stages[0]
      const activeId =
        (typeof overview.election?.activeStageId === 'object'
          ? (overview.election.activeStageId as any)?._id
          : overview.election?.activeStageId) ||
        overview.stages.find((s) => s.stageType === overview.election?.currentStage)?._id ||
        overview.stages[0]?._id;

      if (activeId) {
        setSelectedStageId(activeId);
      }
    } catch (err) {
      console.error('Failed to load election overview:', err);
      // Fallback
      electionService.getStages().then((data) => {
        setStages(data);
        if (data.length > 0) setSelectedStageId(data[0]._id);
      });
    }
  };

  useEffect(() => {
    if (selectedStageId) {
      loadSources(selectedStageId);
    }
  }, [selectedStageId]);

  const loadSources = async (stageId: string) => {
    try {
      setLoading(true);
      const list = await quickcountService.getSources(stageId);
      setSources(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await quickcountService.createSource({
        stageId: selectedStageId,
        sourceCode,
        sourceName,
        workUnit,
        location,
        targetVoters,
      });

      setShowModal(false);
      setMessage({ type: 'success', text: `Sumber suara ${sourceCode} berhasil didaftarkan!` });
      loadSources(selectedStageId);
      setSourceCode('');
      setSourceName('');
      setWorkUnit('');
      setLocation('');
      setTargetVoters(100);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mendaftarkan sumber suara.',
      });
    }
  };

  const handleOpenEdit = (src: VoteSource) => {
    setEditSource(src);
    setEditSourceCode(src.sourceCode);
    setEditSourceName(src.sourceName);
    setEditWorkUnit(src.workUnit);
    setEditLocation(src.location);
    setEditTargetVoters(src.targetVoters || 0);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSource) return;
    setMessage(null);

    try {
      await quickcountService.updateSource(editSource._id, {
        sourceCode: editSourceCode,
        sourceName: editSourceName,
        workUnit: editWorkUnit,
        location: editLocation,
        targetVoters: editTargetVoters,
      });

      setEditSource(null);
      setMessage({ type: 'success', text: `Sumber suara ${editSourceCode} berhasil diperbarui!` });
      loadSources(selectedStageId);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memperbarui sumber suara.',
      });
    }
  };

  const handleDeleteSource = async (src: VoteSource) => {
    if (src.status === 'VERIFIED') {
      alert('Sumber suara ini sudah diverifikasi dan memiliki data suara masuk resmi. Tidak dapat dihapus!');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus sumber suara "${src.sourceCode} - ${src.sourceName}"?`)) {
      return;
    }

    setMessage(null);
    try {
      await quickcountService.deleteSource(src._id);
      setMessage({ type: 'success', text: `Sumber suara ${src.sourceCode} berhasil dihapus.` });
      loadSources(selectedStageId);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus sumber suara.',
      });
    }
  };

  const currentStage = stages.find((s) => s._id === selectedStageId);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            Manajemen Sumber Suara / TPS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftarkan unit kerja, lokasi perhitungan suara fisik, dan alokasi target pemilih untuk setiap tahapan pemilihan
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah TPS / Sumber ({currentStage?.stageType === 'STAGE_2' ? 'Tahap 2' : 'Tahap 1'})</span>
        </button>
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

      {/* Stage Selector */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tahap Pemilihan:</span>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 bg-white dark:bg-navy-900 p-1.5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm w-full xs:w-auto">
          {stages.map((stg) => (
            <button
              key={stg._id}
              onClick={() => setSelectedStageId(stg._id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[38px] flex items-center justify-center gap-1.5 ${
                selectedStageId === stg._id
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              <span>{stg.stageType === 'STAGE_1' ? 'Tahap 1 (Bakal Calon)' : 'Tahap 2 (Definitif)'}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  stg.status === 'COUNTING'
                    ? selectedStageId === stg._id
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/20 text-emerald-500'
                    : selectedStageId === stg._id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-navy-700 text-slate-500'
                }`}
              >
                {stg.status}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                <th className="py-3 px-4">Kode TPS</th>
                <th className="py-3 px-4">Nama Sumber / Posko</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4">Lokasi Fisik</th>
                <th className="py-3 px-4">Target Pemilih</th>
                <th className="py-3 px-4">Status Rekap</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Belum ada TPS atau sumber suara yang terdaftar pada tahap ini.
                  </td>
                </tr>
              ) : (
                sources.map((src) => (
                  <tr key={src._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-black text-xs text-navy-900 dark:text-white">
                      {src.sourceCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-xs text-navy-900 dark:text-white">
                      {src.sourceName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{src.workUnit}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{src.location}</td>
                    <td className="py-3.5 px-4 text-xs font-bold text-navy-900 dark:text-white">
                      {src.targetVoters} Pemilih
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={src.status} type="source" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(src)}
                          title="Edit Sumber Suara"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-electric-600 hover:border-electric-500 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(src)}
                          title={src.status === 'VERIFIED' ? 'Tidak dapat dihapus (Sudah verifikasi)' : 'Hapus Sumber Suara'}
                          disabled={src.status === 'VERIFIED'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            src.status === 'VERIFIED'
                              ? 'border-slate-100 dark:border-navy-800 text-slate-300 dark:text-navy-700 cursor-not-allowed'
                              : 'border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-500'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah TPS Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Tambah TPS / Sumber ({currentStage?.stageType === 'STAGE_2' ? 'Tahap 2' : 'Tahap 1'})
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-navy-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Kode TPS / Sumber</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TPS-01 atau TPS-PLENO-02"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 uppercase font-bold min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Nama Sumber / Posko</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TPS 01 - Terminal Keberangkatan..."
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Unit Kerja Terkait</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Airport Security / Seluruh Unit..."
                  value={workUnit}
                  onChange={(e) => setWorkUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Lokasi Fisik Pemungutan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gedung Serbaguna HLP Lt. 2..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Target Jumlah Pemilih</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={targetVoters}
                  onChange={(e) => setTargetVoters(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 font-bold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-electric-600 text-white font-bold min-h-[40px]"
                >
                  Daftarkan TPS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit TPS */}
      {editSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Edit Sumber Suara / TPS
              </h2>
              <button
                onClick={() => setEditSource(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-navy-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Kode TPS / Sumber</label>
                <input
                  type="text"
                  required
                  value={editSourceCode}
                  onChange={(e) => setEditSourceCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 uppercase font-bold min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Nama Sumber / Posko</label>
                <input
                  type="text"
                  required
                  value={editSourceName}
                  onChange={(e) => setEditSourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Unit Kerja Terkait</label>
                <input
                  type="text"
                  required
                  value={editWorkUnit}
                  onChange={(e) => setEditWorkUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Lokasi Fisik Pemungutan</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Target Jumlah Pemilih</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editTargetVoters}
                  onChange={(e) => setEditTargetVoters(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSource(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 font-bold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-electric-600 text-white font-bold min-h-[40px]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
