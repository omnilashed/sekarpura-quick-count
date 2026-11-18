import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Redirect based on role and first login change password requirement
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.role === 'CANDIDATE' && currentUser?.mustChangePassword) {
          navigate('/candidate/settings');
        } else if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
          navigate('/admin');
        } else if (currentUser?.role === 'CANDIDATE') {
          navigate('/candidate');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Login gagal.');
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-6 sm:py-10 px-2 sm:px-4">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-gradient-to-tr from-navy-950 to-navy-800 border border-gold-500/40 p-2 shadow-xl mb-1">
            <img src="/logo.svg" alt="SEKARPURA Logo" className="w-8 sm:w-10 h-8 sm:h-10 object-contain" />
          </div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
            Masuk Portal Resmi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            SEKARPURA Election Center Cabang Halim Perdanakusuma
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-600 dark:text-gold-400 text-[10px] sm:text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>"One Vision, One Heart : Strengthening Employee Solidarity"</span>
            </span>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-5 xs:p-6 sm:p-8 shadow-xl">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sekarpura-halim.org"
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-electric-500/25 transition-all disabled:opacity-50 min-h-[44px]"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secure Portal Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-navy-800 flex items-center justify-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Portal Terenkripsi & Terautentikasi Panitia & Kandidat</span>
          </div>
        </div>
      </div>
    </div>
  );
};
