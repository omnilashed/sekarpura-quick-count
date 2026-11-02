import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { SystemSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    settingsService.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const updated = await settingsService.updateSettings(settings);
      setSettings(updated.data);
      setMessage({ type: 'success', text: 'Pengaturan sistem berhasil disimpan!' });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menyimpan pengaturan.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-20 text-center text-sm">Memuat pengaturan sistem...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Pengaturan Aplikasi & Identitas Sistem
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi nama aplikasi, cabang, visibilitas quickcount live, dan kontak sekretariat
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

      <form onSubmit={handleSave} className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nama Aplikasi
            </label>
            <input
              type="text"
              required
              value={settings.appName}
              onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Cabang Serikat
            </label>
            <input
              type="text"
              required
              value={settings.branchName}
              onChange={(e) => setSettings({ ...settings, branchName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[42px]"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 text-xs">
            Tagline / Slogan Aplikasi
          </label>
          <input
            type="text"
            required
            value={settings.appTagline}
            onChange={(e) => setSettings({ ...settings, appTagline: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs min-h-[42px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Email Sekretariat
            </label>
            <input
              type="email"
              required
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nomor Telepon Sekretariat
            </label>
            <input
              type="text"
              required
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[42px]"
            />
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-3 sm:space-y-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-navy-900 dark:text-white">Indikator LIVE Rekapitulasi</p>
              <p className="text-slate-500 dark:text-slate-400">Tampilkan badge LIVE berkedip di header website publik</p>
            </div>
            <input
              type="checkbox"
              checked={settings.liveIndicator}
              onChange={(e) => setSettings({ ...settings, liveIndicator: e.target.checked })}
              className="w-5 h-5 text-electric-600 rounded shrink-0"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-navy-900 dark:text-white">Izin Sunting Mandiri Kandidat</p>
              <p className="text-slate-500 dark:text-slate-400">Izinkan bakal calon memperbarui biodata dan visi misi mandiri</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowCandidateEdit}
              onChange={(e) => setSettings({ ...settings, allowCandidateEdit: e.target.checked })}
              className="w-5 h-5 text-electric-600 rounded shrink-0"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-navy-900 dark:text-white">Visibilitas QuickCount Publik</p>
              <p className="text-slate-500 dark:text-slate-400">Tampilkan hasil perolehan suara live kepada publik</p>
            </div>
            <input
              type="checkbox"
              checked={settings.publicQuickCountVisible}
              onChange={(e) =>
                setSettings({ ...settings, publicQuickCountVisible: e.target.checked })
              }
              className="w-5 h-5 text-electric-600 rounded shrink-0"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
        </button>
      </form>
    </div>
  );
};
