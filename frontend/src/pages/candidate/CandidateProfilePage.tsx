import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { CheckCircle2, AlertCircle, Save, Camera } from 'lucide-react';
import { BASE_URL } from '../../services/api';

export const CandidateProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('');
  const [workUnit, setWorkUnit] = useState('');
  const [department, setDepartment] = useState('');
  const [tenure, setTenure] = useState('');
  const [biography, setBiography] = useState('');

  useEffect(() => {
    if (user?.candidateId) {
      candidateService.getById(user.candidateId).then((data) => {
        setCandidate(data);
        setFullName(data.fullName || '');
        setNickname(data.nickname || '');
        setPosition(data.position || '');
        setWorkUnit(data.workUnit || '');
        setDepartment(data.department || '');
        setTenure(data.tenure || '');
        setBiography(data.biography || '');
        setLoading(false);
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await candidateService.update(candidate._id, {
        fullName,
        nickname,
        position,
        workUnit,
        department,
        tenure,
        biography,
      });

      setCandidate(res.data);
      if (user) {
        setUser({ ...user, name: res.data.fullName, candidate: res.data });
      }
      setMessage({ type: 'success', text: 'Data profil berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan perubahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !candidate) return;
    const file = e.target.files[0];

    try {
      const res = await candidateService.uploadPhoto(candidate._id, file);
      setCandidate({ ...candidate, profilePhoto: res.photoUrl });
      if (user) {
        setUser({ ...user, candidate: { ...candidate, profilePhoto: res.photoUrl } });
      }
      setMessage({ type: 'success', text: 'Foto profil berhasil diunggah!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengunggah foto.',
      });
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat profil...</div>;
  }

  const photoSrc = candidate?.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Biodata & Informasi Personal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Lengkapi informasi jabatan, unit kerja, dan deskripsi diri untuk profil kampanye Anda
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

      {/* Photo Upload Section */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 shadow-inner">
            <img
              src={photoSrc}
              alt="Foto Profil"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>
          <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-electric-600 text-white shadow-md cursor-pointer hover:bg-electric-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">Foto Profil Resmi</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Format JPG, PNG, atau WebP. Maksimal 5 MB. Gunakan foto berseragam resmi atau pakaian rapi.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Nama Lengkap & Gelar
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Nama Panggilan / Sapaan Akrab
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Jabatan di Perusahaan
            </label>
            <input
              type="text"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Unit Kerja
            </label>
            <input
              type="text"
              required
              value={workUnit}
              onChange={(e) => setWorkUnit(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Departemen / Divisi
            </label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Masa Kerja
            </label>
            <input
              type="text"
              placeholder="Contoh: 12 Tahun"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
            Biografi Ringkas & Dedikasi di Bandara
          </label>
          <textarea
            rows={4}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Tuliskan ringkasan pengalaman dan komitmen Anda..."
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </form>
    </div>
  );
};
