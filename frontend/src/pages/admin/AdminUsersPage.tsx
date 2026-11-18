import React, { useEffect, useState } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Copy,
  Check,
  ShieldAlert,
  X,
  Lock,
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useAuthStore } from '../../stores/authStore';
import { User } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Reset Password State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const DEFAULT_RESET_PASSWORD = 'SekarpuraIndonesiaHlp2026!';

  // New Admin form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await settingsService.createAdmin({ name, email, password, role });
      setShowModal(false);
      setMessage({ type: 'success', text: `Akun admin ${name} berhasil dibuat!` });
      loadUsers();
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal membuat akun admin.',
      });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await settingsService.toggleUserStatus(user.id);
      loadUsers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengubah status pengguna.',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) return;
    setResetting(true);
    setMessage(null);

    try {
      const res = await settingsService.resetPassword(resetModalUser.id);
      setMessage({
        type: 'success',
        text: `Kata sandi akun ${resetModalUser.name} (${resetModalUser.email}) berhasil di-reset menjadi "${res.data.defaultPassword}". Pengguna wajib mengganti sandi pada login berikutnya.`,
      });
      setResetModalUser(null);
      loadUsers();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal me-reset kata sandi pengguna.',
      });
    } finally {
      setResetting(false);
    }
  };

  const copyDefaultPassword = () => {
    navigator.clipboard.writeText(DEFAULT_RESET_PASSWORD);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola petugas administrator, panitia pemilihan, dan akses portal login kandidat
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Petugas Admin</span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
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

      {/* Users Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                <th className="py-3.5 px-4">Nama Pengguna</th>
                <th className="py-3.5 px-4">Alamat Email</th>
                <th className="py-3.5 px-4">Role / Peran</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white">
                        {u.name}
                      </div>
                      {u.mustChangePassword && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          Wajib Ganti Password
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-gold-500/15 text-gold-600 dark:text-gold-400 border-gold-500/30'
                            : u.role === 'ADMIN'
                            ? 'bg-electric-500/15 text-electric-600 dark:text-electric-400 border-electric-500/30'
                            : 'bg-slate-100 dark:bg-navy-800 text-slate-500 border-slate-200 dark:border-navy-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold inline-flex items-center gap-1.5 ${
                          u.status === 'ACTIVE'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{u.status === 'ACTIVE' ? 'Aktif' : 'Dinonaktifkan'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Reset Password Button (Super Admin Only) */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => setResetModalUser(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-all shadow-sm"
                            title="Reset Kata Sandi Akun ke Default"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Reset Password</span>
                          </button>
                        )}

                        {/* Toggle Status Button */}
                        {isSuperAdmin && u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                          >
                            {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Konfirmasi Reset Password Akun (Super Admin) */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center gap-2.5 text-amber-500">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-navy-900 dark:text-white">
                    Reset Kata Sandi Akun
                  </h3>
                  <p className="text-[11px] text-slate-400">Tindakan Super Administrator</p>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Anda akan me-reset kata sandi untuk pengguna berikut:
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700/80 space-y-1">
                <p className="font-extrabold text-navy-900 dark:text-white text-sm">
                  {resetModalUser.name}
                </p>
                <p className="text-slate-500 dark:text-slate-400">{resetModalUser.email}</p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-navy-700 text-slate-700 dark:text-slate-300">
                  Role: {resetModalUser.role}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kata Sandi Default Baru:
                </label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-navy-950 border border-gold-500/30 text-gold-300 font-mono text-xs">
                  <span className="select-all font-bold">{DEFAULT_RESET_PASSWORD}</span>
                  <button
                    type="button"
                    onClick={copyDefaultPassword}
                    className="p-1 rounded-lg hover:bg-navy-800 text-slate-300 hover:text-white transition-colors"
                    title="Salin Kata Sandi"
                  >
                    {copiedPassword ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Setelah di-reset, kata sandi lama akun ini tidak lagi berlaku. Pengguna wajib mengganti kata sandi pada saat pertama kali login.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                disabled={resetting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{resetting ? 'Memproses Reset...' : 'Konfirmasi Reset Password'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tambah Petugas Admin Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-extrabold text-navy-900 dark:text-white mb-4">
              Tambah Akun Administrator Baru
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Nama Lengkap Petugas</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Panitia Pemilihan Halim..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Email Login</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.panitia@sekarpura-halim.org"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Tingkat Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700"
                >
                  <option value="ADMIN">ADMIN (Petugas Rekapitulasi & Verifikasi)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Akses Penuh Pengaturan)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-electric-600 text-white font-bold"
                >
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
