import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { Plus, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const CandidateVisionMissionPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [vision, setVision] = useState('');
  const [mission, setMission] = useState<string[]>([]);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [expectations, setExpectations] = useState('');

  useEffect(() => {
    if (user?.candidateId) {
      candidateService.getById(user.candidateId).then((data) => {
        setCandidate(data);
        setVision(data.vision || '');
        setMission(data.mission && data.mission.length > 0 ? data.mission : ['']);
        setCampaignMessage(data.campaignMessage || '');
        setExpectations(data.expectations || '');
        setLoading(false);
      });
    }
  }, [user]);

  const addMissionItem = () => {
    setMission([...mission, '']);
  };

  const removeMissionItem = (index: number) => {
    setMission(mission.filter((_, i) => i !== index));
  };

  const updateMissionItem = (index: number, val: string) => {
    const updated = [...mission];
    updated[index] = val;
    setMission(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;
    setSaving(true);
    setMessage(null);

    const filteredMission = mission.filter((m) => m.trim().length > 0);

    try {
      const res = await candidateService.update(candidate._id, {
        vision,
        mission: filteredMission,
        campaignMessage,
        expectations,
      });

      setCandidate(res.data);
      if (user) {
        setUser({ ...user, candidate: res.data });
      }
      setMessage({ type: 'success', text: 'Visi, misi, dan gagasan berhasil disimpan!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan perubahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat visi & misi...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Visi, Misi & Komitmen Organisasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Rumuskan visi kepemimpinan dan pokok kebijakan yang akan Anda perjuangkan untuk seluruh anggota
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

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Visi */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-3 sm:space-y-4">
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Visi Kepemimpinan Calon Ketua
          </label>
          <textarea
            rows={3}
            required
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Mewujudkan SEKARPURA Halim yang mandiri, berintegritas, dan solutif..."
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
          />
        </div>

        {/* Misi */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Misi & Pokok Kebijakan
            </label>
            <button
              type="button"
              onClick={addMissionItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 font-bold text-xs hover:bg-electric-500/20 transition-colors self-start xs:self-auto min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Poin Misi</span>
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {mission.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateMissionItem(idx, e.target.value)}
                  placeholder={`Poin misi ke-${idx + 1}...`}
                  className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[40px]"
                />
                {mission.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMissionItem(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl min-h-[38px] min-w-[38px] flex items-center justify-center"
                    aria-label="Hapus poin misi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Message & Expectations */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Pesan Khusus Kepada Anggota Serikat
            </label>
            <textarea
              rows={2}
              value={campaignMessage}
              onChange={(e) => setCampaignMessage(e.target.value)}
              placeholder="Solidaritas bukan sekadar kata, melainkan tindakan nyata..."
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Harapan Terhadap SEKARPURA di Masa Depan
            </label>
            <textarea
              rows={2}
              value={expectations}
              onChange={(e) => setExpectations(e.target.value)}
              placeholder="Harapan bagi serikat pekerja yang berdaulat, mandiri, dan bermartabat..."
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Visi & Misi'}</span>
        </button>
      </form>
    </div>
  );
};
