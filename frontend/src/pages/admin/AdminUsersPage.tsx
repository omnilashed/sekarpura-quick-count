import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { User } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola petugas administrator, panitia pemilihan, dan akses portal login kandidat
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Petugas Admin</span>
        </button>
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
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Alamat Email</th>
                <th className="py-3 px-4">Role / Peran</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-xs text-navy-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-gold-500/15 text-gold-600'
                          : u.role === 'ADMIN'
                          ? 'bg-electric-500/15 text-electric-600'
                          : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold ${
                        u.status === 'ACTIVE' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Aktif' : 'Dinonaktifkan'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className="px-3 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-navy-700 hover:bg-slate-100"
                    >
                      {u.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border"
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border"
                />
              </div>
              <div>
                <label className="block font-bold uppercase mb-1">Tingkat Hak Akses</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border"
                >
                  <option value="ADMIN">ADMIN (Petugas Rekapitulasi & Verifikasi)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Akses Penuh Pengaturan)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
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
