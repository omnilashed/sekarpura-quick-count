import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { candidateService } from '../../services/candidateService';
import { Candidate, CandidateProgram } from '../../types';
import { Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const CandidateProgramsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [programs, setPrograms] = useState<CandidateProgram[]>([]);

  useEffect(() => {
    if (user?.candidateId) {
      candidateService.getById(user.candidateId).then((data) => {
        setCandidate(data);
        setPrograms(
          data.programs && data.programs.length > 0
            ? data.programs
            : [{ title: '', description: '', priority: 1 }]
        );
        setLoading(false);
      });
    }
  }, [user]);

  const addProgram = () => {
    setPrograms([...programs, { title: '', description: '', priority: programs.length + 1 }]);
  };

  const removeProgram = (index: number) => {
    setPrograms(programs.filter((_, i) => i !== index));
  };

  const updateProgram = (index: number, field: keyof CandidateProgram, value: any) => {
    const updated = [...programs];
    updated[index] = { ...updated[index], [field]: value };
    setPrograms(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;
    setSaving(true);
    setMessage(null);

    const validPrograms = programs.filter(
      (p) => p.title.trim().length > 0 && p.description.trim().length > 0
    );

    try {
      const res = await candidateService.update(candidate._id, {
        programs: validPrograms,
      });

      setCandidate(res.data);
      if (user) {
        setUser({ ...user, candidate: res.data });
      }
      setMessage({ type: 'success', text: 'Program kerja unggulan berhasil disimpan!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan program.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat program kerja...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            Program Kerja Unggulan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Susun rencana aksi 100 hari pertama dan target nyata peningkatan kesejahteraan anggota
          </p>
        </div>

        <button
          type="button"
          onClick={addProgram}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Program</span>
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

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {programs.map((prog, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm space-y-3 sm:space-y-4 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400">
                Program #{idx + 1}
              </span>
              {programs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProgram(idx)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Hapus Program"
                  aria-label="Hapus Program"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Judul Program Kerja
              </label>
              <input
                type="text"
                required
                value={prog.title}
                onChange={(e) => updateProgram(idx, 'title', e.target.value)}
                placeholder="Contoh: Penguatan Klausul Kesejahteraan PKB 2026..."
                className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Deskripsi & Target Pelaksanaan
              </label>
              <textarea
                rows={3}
                required
                value={prog.description}
                onChange={(e) => updateProgram(idx, 'description', e.target.value)}
                placeholder="Uraikan langkah nyata, target waktu, dan penerima manfaat..."
                className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Program'}</span>
        </button>
      </form>
    </div>
  );
};
