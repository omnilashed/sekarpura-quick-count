import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { VoteSource, ElectionStage } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminVoteSourcesPage: React.FC = () => {
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [sources, setSources] = useState<VoteSource[]>([]);
  const [, setLoading] = useState(true);

  // New source form
  const [showModal, setShowModal] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [workUnit, setWorkUnit] = useState('');
  const [location, setLocation] = useState('');
  const [targetVoters, setTargetVoters] = useState(100);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    electionService.getStages().then((data) => {
      setStages(data);
      if (data.length > 0) setSelectedStageId(data[0]._id);
    });
  }, []);

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
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mendaftarkan sumber suara.',
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            Manajemen Sumber Suara / TPS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftarkan unit kerja, lokasi perhitungan suara fisik, dan alokasi target pemilih
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah TPS / Sumber</span>
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[38px] flex items-center justify-center ${
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

      {/* Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[580px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                <th className="py-3 px-4">Kode TPS</th>
                <th className="py-3 px-4">Nama Sumber / Posko</th>
                <th className="py-3 px-4">Unit Kerja</th>
                <th className="py-3 px-4">Lokasi Fisik</th>
                <th className="py-3 px-4">Target Pemilih</th>
                <th className="py-3 px-4">Status Rekap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {sources.map((src) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white mb-4">
              Tambah Sumber Suara / TPS Baru
            </h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Kode TPS / Sumber</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TPS-11"
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
                  placeholder="Contoh: TPS 11 - Unit Terminal Kargo..."
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
                  placeholder="Contoh: Cargo Operations..."
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
                  placeholder="Contoh: Ruang Rapat Kargo Lt. 1..."
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
    </div>
  );
};
