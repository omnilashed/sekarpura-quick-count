import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { presentationService } from '../../services/presentationService';
import { Presentation as PresentationType } from '../../types';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  ShieldCheck,
  Copy,
  Check,
  Clock,
  Layers,
  HardDrive,
  Download,
} from 'lucide-react';
import { PresentationViewer } from '../../components/presentation/PresentationViewer';
import { formatWibShortDateTime } from '../../utils/date';

export const CandidatePresentationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [presentation, setPresentation] = useState<PresentationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    computedSha256: string;
  } | null>(null);

  // Upload inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchCandidatePresentation();
  }, [user]);

  const fetchCandidatePresentation = async () => {
    if (!user?.candidateId) return;
    try {
      const data = await presentationService.getByCandidate(user.candidateId);
      setPresentation(data);
    } catch {
      // Presentation not yet uploaded
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExts = ['.pdf', '.ppt', '.pptx'];
    const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setMessage({
        type: 'error',
        text: 'Format file tidak didukung. Harap pilih file resmi presentasi (.pptx, .ppt, atau .pdf).',
      });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file melebihi batas maksimum 50 MB.' });
      return;
    }
    setSelectedFile(file);
    setMessage(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user?.candidateId) return;
    setUploading(true);
    setUploadProgress(0);
    setMessage(null);
    setVerificationResult(null);

    try {
      await presentationService.upload(
        selectedFile,
        user.candidateId,
        title || undefined,
        description || undefined,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      );

      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setMessage({
        type: 'success',
        text: 'File materi asli berhasil diunggah ke penyimpanan terdistribusi GridFS!',
      });

      // Refetch fresh data directly from server
      await fetchCandidatePresentation();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengunggah file materi presentasi.',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCopySha256 = () => {
    if (!presentation?.sha256) return;
    navigator.clipboard.writeText(presentation.sha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const handleVerifyIntegrity = async () => {
    if (!presentation?._id) return;
    setVerifying(true);
    try {
      const res = await presentationService.verifyChecksum(presentation._id);
      setVerificationResult({
        valid: res.data.isIntegrityValid,
        computedSha256: res.data.computedSha256,
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Gagal memverifikasi checksum ke server.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return formatWibShortDateTime(dateStr);
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat data materi presentasi...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Manajemen Materi Presentasi Kandidat
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Penyimpanan biner asli terjamin (GridFS) dengan verifikasi kriptografi SHA-256 untuk paparan visi & misi
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl flex items-center gap-2.5 text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Banner: Prinsip File Asli */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-electric-500/10 to-gold-500/10 border border-electric-500/20 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-3 shadow-sm">
        <div className="w-7 h-7 rounded-lg bg-electric-500/20 text-electric-600 dark:text-electric-400 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-navy-900 dark:text-white">
            Prinsip Penyimpanan: File Asli 100% Tidak Pernah Diubah
          </p>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Sistem menyimpan file materi asli Anda ke dalam <strong>MongoDB GridFS</strong> tanpa kompresi atau degradasi grafis. Dokumen <strong>PDF (.pdf)</strong> atau presentasi <strong>PowerPoint (.pptx / .ppt)</strong> Anda dapat diunduh kembali secara utuh dengan hash integritas yang sama persis saat diunggah.
          </p>
        </div>
      </div>

      {/* Existing Presentation File Details Card (if uploaded) */}
      {presentation && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-electric-600/15 text-electric-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-navy-900 dark:text-white truncate">
                    {presentation.originalFileName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-electric-500/15 text-electric-600 dark:text-electric-400 border border-electric-500/20 shrink-0">
                    Versi {presentation.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {presentation.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={presentationService.getDownloadUrl(presentation._id)}
                download={presentation.originalFileName}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs shadow-sm transition-all"
                title="Unduh File Asli"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File Asli</span>
              </a>
              <button
                onClick={fetchCandidatePresentation}
                className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Muat Ulang Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Ukuran File
              </span>
              <span className="font-bold text-navy-900 dark:text-white">
                {formatFileSize(presentation.fileSize)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Tipe Format
              </span>
              <span className="font-bold text-navy-900 dark:text-white uppercase">
                .{presentation.fileType}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Waktu Unggah
              </span>
              <span className="font-bold text-navy-900 dark:text-white text-[11px]">
                {formatDate(presentation.uploadedAt)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Status Sistem
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersimpan di GridFS</span>
              </span>
            </div>
          </div>

          {/* SHA-256 Checksum Badge & Verification */}
          {presentation.sha256 && (
            <div className="p-3.5 rounded-2xl bg-slate-900 dark:bg-navy-950 border border-slate-800 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-gold-400" />
                  <span className="font-bold text-[11px] text-slate-200">
                    Sidik Jari Kriptografi (SHA-256):
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySha256}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 text-[11px] font-semibold transition-colors"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Hash</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleVerifyIntegrity}
                    disabled={verifying}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-electric-600/30 hover:bg-electric-600/50 text-electric-300 text-[11px] font-bold border border-electric-500/30 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${verifying ? 'animate-spin' : ''}`} />
                    <span>{verifying ? 'Memverifikasi...' : 'Verifikasi Integritas'}</span>
                  </button>
                </div>
              </div>

              <div className="font-mono text-[11px] text-gold-300/90 break-all bg-black/40 p-2 rounded-xl border border-white/5 select-all">
                {presentation.sha256}
              </div>

              {verificationResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-[11px] flex items-center gap-2 font-semibold ${
                    verificationResult.valid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {verificationResult.valid
                      ? 'Integritas 100% Terverifikasi: File di penyimpanan GridFS identik byte-for-byte dengan hash saat diunggah.'
                      : 'Peringatan: Hash file tidak cocok.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Form Card */}
      <form
        onSubmit={handleUpload}
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
            {presentation ? 'Unggah Versi Baru Materi Presentasi' : 'Unggah Materi Presentasi'}
          </h2>
          {presentation && (
            <span className="text-[11px] font-bold text-slate-400">
              Akan disimpan sebagai Versi {presentation.version + 1}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Judul Paparan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemaparan Visi, Misi, & Program Kerja 2026..."
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Deskripsi Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ringkasan poin-poin utama materi..."
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all ${
            dragActive
              ? 'border-electric-500 bg-electric-500/10'
              : selectedFile
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-slate-300 dark:border-navy-700 hover:border-electric-500'
          }`}
        >
          <Upload className="w-9 h-9 text-slate-400 mx-auto mb-2.5 sm:mb-3" />
          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 break-all">
                File Terpilih: {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                Ukuran: {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
                Tarik & lepaskan file presentasi di sini, atau klik tombol di bawah
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Format yang didukung: <strong>.pptx, .ppt, .pdf</strong> (Maksimal 50 MB)
              </p>
            </div>
          )}

          <label className="mt-3.5 sm:mt-4 inline-block px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-sm min-h-[40px]">
            <span>Pilih File Dari Perangkat</span>
            <input
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={(e) => {
                if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>Mengunggah file ke GridFS...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-electric-500 to-gold-400 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? `Mengunggah (${uploadProgress}%)...` : 'Simpan File Asli ke GridFS'}</span>
        </button>
      </form>

      {/* Live Preview Viewer */}
      {presentation && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white truncate">
              Pratinjau Materi Presentasi
            </h2>
            <button
              onClick={fetchCandidatePresentation}
              className="flex items-center gap-1.5 text-xs text-electric-600 dark:text-electric-400 hover:underline font-semibold shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>

          <PresentationViewer presentation={presentation} />
        </div>
      )}
    </div>
  );
};
