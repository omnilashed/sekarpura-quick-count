import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BASE_URL } from '../../services/api';

export const AdminCandidatesPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    candidateNumber: 11,
    fullName: '',
    nickname: '',
    email: '',
    password: '',
    position: '',
    workUnit: '',
    department: '',
  });

  // Verify form state
  const [verifyStatus, setVerifyStatus] = useState<'VERIFIED' | 'REJECTED' | 'PENDING'>('VERIFIED');
  const [publicationStatus, setPublicationStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [candidacyStatus, setCandidacyStatus] = useState<any>('BAKAL_CALON');
  const [rejectionReason, setRejectionReason] = useState('');

  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await candidateService.getAll({ search: search || undefined });
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      await candidateService.create(createForm);
      setShowCreateModal(false);
      setActionMessage({ type: 'success', text: 'Bakal calon & akun login berhasil didaftarkan!' });
      fetchCandidates();
      setCreateForm({
        candidateNumber: candidates.length + 1,
        fullName: '',
        nickname: '',
        email: '',
        password: '',
        position: '',
        workUnit: '',
        department: '',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mendaftarkan kandidat.',
      });
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setActionMessage(null);

    try {
      await candidateService.verify(selectedCandidate._id, {
        verificationStatus: verifyStatus as any,
        publicationStatus,
        candidacyStatus,
        rejectionReason: verifyStatus === 'REJECTED' ? rejectionReason : undefined,
      });

      setShowVerifyModal(false);
      setActionMessage({
        type: 'success',
        text: `Status kandidat #${selectedCandidate.candidateNumber} berhasil diperbarui!`,
      });
      fetchCandidates();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memverifikasi kandidat.',
      });
    }
  };

  const handleDelete = async (candidate: Candidate) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus kandidat #${candidate.candidateNumber} (${candidate.fullName}) beserta akun login terkait?`
      )
    ) {
      return;
    }

    try {
      await candidateService.delete(candidate._id);
      setActionMessage({ type: 'success', text: 'Kandidat berhasil dihapus.' });
      fetchCandidates();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal menghapus kandidat.',
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            Manajemen Bakal Calon & Calon Ketua
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Daftarkan kandidat baru, verifikasi data profil, dan kelola status pencalonan
          </p>
        </div>

        <button
          onClick={() => {
            setCreateForm({
              ...createForm,
              candidateNumber: candidates.length > 0 ? Math.max(...candidates.map((c) => c.candidateNumber)) + 1 : 1,
            });
            setShowCreateModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-md shadow-electric-600/20 transition-all self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Bakal Calon</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3 sm:p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Search Input & View Switcher */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kandidat berdasarkan nama atau nomor urut..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
          />
        </div>

        {/* View mode toggle on mobile */}
        <div className="flex items-center gap-1 self-end xs:self-auto bg-slate-100 dark:bg-navy-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-navy-700 text-electric-600 dark:text-electric-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabel</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-navy-700 text-electric-600 dark:text-electric-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kartu</span>
          </button>
        </div>
      </div>

      {/* Cards View (Mobile Friendly) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {candidates.map((c) => {
            const photoSrc = c.profilePhoto
              ? c.profilePhoto.startsWith('http')
                ? c.profilePhoto
                : `${BASE_URL}${c.profilePhoto}`
              : '/logo.svg';

            return (
              <div
                key={c._id}
                className="p-4 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={photoSrc}
                    alt={c.fullName}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-navy-700 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-gold-400 text-navy-950">
                        #{c.candidateNumber}
                      </span>
                      <p className="font-extrabold text-xs text-navy-900 dark:text-white truncate">
                        {c.fullName}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {c.position}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{c.workUnit}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                  <StatusBadge status={c.candidacyStatus} type="candidacy" />
                  <StatusBadge status={c.verificationStatus} type="verification" />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.publicationStatus === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-400'
                    }`}
                  >
                    {c.publicationStatus === 'PUBLISHED' ? 'Terbit Publik' : 'Draft'}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                  <button
                    onClick={() => {
                      setSelectedCandidate(c);
                      setVerifyStatus(c.verificationStatus as any);
                      setPublicationStatus(c.publicationStatus as any);
                      setCandidacyStatus(c.candidacyStatus);
                      setRejectionReason(c.rejectionReason || '');
                      setShowVerifyModal(true);
                    }}
                    className="flex-1 py-2 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400 text-xs font-bold transition-colors text-center min-h-[38px] flex items-center justify-center"
                  >
                    Verifikasi
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Hapus Kandidat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Candidates Table */
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                  <th className="py-3 px-4">No. Urut</th>
                  <th className="py-3 px-4">Kandidat</th>
                  <th className="py-3 px-4">Jabatan & Unit Kerja</th>
                  <th className="py-3 px-4">Status Pencalonan</th>
                  <th className="py-3 px-4">Verifikasi</th>
                  <th className="py-3 px-4">Publikasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
                {candidates.map((c) => {
                  const photoSrc = c.profilePhoto
                    ? c.profilePhoto.startsWith('http')
                      ? c.profilePhoto
                      : `${BASE_URL}${c.profilePhoto}`
                    : '/logo.svg';

                  return (
                    <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-black text-sm text-navy-900 dark:text-white">
                        #{c.candidateNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={photoSrc}
                            alt={c.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-navy-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.svg';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-navy-900 dark:text-white truncate">
                              {c.fullName}
                            </p>
                            <p className="text-xs text-slate-400">"{c.nickname}"</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <p className="font-semibold">{c.position}</p>
                        <p className="text-slate-400">{c.workUnit}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.candidacyStatus} type="candidacy" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.verificationStatus} type="verification" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-bold ${
                            c.publicationStatus === 'PUBLISHED'
                              ? 'text-emerald-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {c.publicationStatus === 'PUBLISHED' ? 'Terbit Publik' : 'Draft Internal'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCandidate(c);
                              setVerifyStatus(c.verificationStatus as any);
                              setPublicationStatus(c.publicationStatus as any);
                              setCandidacyStatus(c.candidacyStatus);
                              setRejectionReason(c.rejectionReason || '');
                              setShowVerifyModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 text-electric-600 dark:text-electric-400 text-xs font-bold transition-colors min-h-[36px]"
                          >
                            Verifikasi
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Hapus Kandidat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create Candidate */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg xs:text-xl font-extrabold text-navy-900 dark:text-white mb-1">
              Pendaftaran Bakal Calon Baru
            </h2>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">
              Sistem akan otomatis membuat akun login portal bagi kandidat ini.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 sm:space-y-4 text-xs">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nomor Urut
                  </label>
                  <input
                    type="number"
                    required
                    value={createForm.candidateNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, candidateNumber: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 font-bold min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.nickname}
                    onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
                    placeholder="Contoh: Mas Budi"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Contoh: Budi Santoso, S.Sos."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Email Akun Login
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="kandidat@sekarpura.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Password Akun
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Jabatan di Bandara
                </label>
                <input
                  type="text"
                  required
                  value={createForm.position}
                  onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                  placeholder="Airport Security Specialist..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Unit Kerja
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.workUnit}
                    onChange={(e) => setCreateForm({ ...createForm, workUnit: e.target.value })}
                    placeholder="Aviation Security..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Departemen
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    placeholder="Security Division..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-slate-600 dark:text-slate-300 font-bold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-electric-600 text-white font-bold min-h-[40px]"
                >
                  Daftarkan Kandidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Verify & Approve Candidate */}
      {showVerifyModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white mb-1">
              Verifikasi Kandidat #{selectedCandidate.candidateNumber}
            </h2>
            <p className="text-xs text-slate-500 mb-4 sm:mb-6">{selectedCandidate.fullName}</p>

            <form onSubmit={handleVerifySubmit} className="space-y-3 sm:space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Status Verifikasi Berkas
                </label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                >
                  <option value="VERIFIED">TERVERIFIKASI (Disetujui)</option>
                  <option value="PENDING">PENDING (Menunggu Review)</option>
                  <option value="REJECTED">DITOLAK</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Status Publikasi ke Website
                </label>
                <select
                  value={publicationStatus}
                  onChange={(e) => setPublicationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                >
                  <option value="PUBLISHED">PUBLIK (Dapat Dilihat Seluruh Anggota)</option>
                  <option value="DRAFT">DRAFT (Hanya Internal Admin/Kandidat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Status Pencalonan
                </label>
                <select
                  value={candidacyStatus}
                  onChange={(e) => setCandidacyStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 min-h-[40px]"
                >
                  <option value="BAKAL_CALON">Bakal Calon (Tahap 1)</option>
                  <option value="CALON_TETAP">Calon Ketua Definitif (Tahap 2)</option>
                  <option value="TERPILIH">Ketua Terpilih</option>
                  <option value="DISKUALIFIKASI">Diskualifikasi</option>
                </select>
              </div>

              {verifyStatus === 'REJECTED' && (
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Alasan Penolakan
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Jelaskan kekurangan berkas atau syarat yang belum terpenuhi..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700"
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-4 py-2.5 rounded-xl border text-slate-600 dark:text-slate-300 font-bold min-h-[40px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-electric-600 text-white font-bold min-h-[40px]"
                >
                  Simpan Keputusan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
