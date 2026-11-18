import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { presentationService } from '../../services/presentationService';
import { Presentation as PresentationType } from '../../types';
import { Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PresentationViewer } from '../../components/presentation/PresentationViewer';

export const CandidatePresentationPage: React.FC = () => {
  const { user } = useAuthStore();
  const [presentation, setPresentation] = useState<PresentationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        text: 'Format file tidak didukung. Harap pilih file .pptx, .ppt, atau .pdf.',
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
    setMessage(null);

    try {
      const res = await presentationService.upload(
        selectedFile,
        user.candidateId,
        title || undefined,
        description || undefined
      );

      setPresentation(res.data);
      setSelectedFile(null);
      setMessage({
        type: 'success',
        text: 'File materi berhasil diunggah! Sistem sedang memproses slide untuk penampil web.',
      });

      // Poll after 3s to get completed status
      setTimeout(() => {
        fetchCandidatePresentation();
      }, 3000);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Gagal mengunggah file materi.',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat materi presentasi...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Manajemen Materi Presentasi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unggah slide presentasi PowerPoint (.pptx / .ppt) atau dokumen PDF untuk dipelajari oleh seluruh anggota
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

      {/* Tip Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-electric-500/10 to-gold-500/10 border border-electric-500/20 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-3 shadow-sm">
        <div className="w-6 h-6 rounded-lg bg-electric-500/20 text-electric-600 dark:text-electric-400 flex items-center justify-center shrink-0 mt-0.5">
          <Upload className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="font-bold text-navy-900 dark:text-white">Format Materi Terbaik:</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Sistem mendukung <strong>.pdf, .pptx, dan .ppt</strong>. Untuk presentasi yang memiliki tata letak grafis, diagram, dan tabel kompleks, disarankan mengunggah dalam format <strong>PDF (.pdf)</strong> (dari PowerPoint: <em>File &gt; Save As &gt; PDF</em>) agar seluruh tampilan visual tampil 100% presisi dan tajam di browser.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <form onSubmit={handleUpload} className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
        <h2 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
          {presentation ? 'Ganti / Perbarui Materi Presentasi' : 'Unggah Presentasi Baru'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Judul Paparan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pemaparan Visi & Rencana Strategis 2026..."
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
              placeholder="Gagasan pokok dan ringkasan isi paparan..."
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[42px]"
            />
          </div>
        </div>

        {/* Drag and drop zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-5 xs:p-6 sm:p-8 text-center transition-all ${
            dragActive
              ? 'border-electric-500 bg-electric-500/10'
              : selectedFile
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-slate-300 dark:border-navy-700 hover:border-electric-500'
          }`}
        >
          <Upload className="w-8 sm:w-10 h-8 sm:h-10 text-slate-400 mx-auto mb-2.5 sm:mb-3" />
          {selectedFile ? (
            <div className="space-y-1">
              <p className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 break-all">
                File Terpilih: {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400">
                Ukuran: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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

          <label className="mt-3 sm:mt-4 inline-block px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-sm min-h-[40px]">
            <span>Pilih File Dari Komputer</span>
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

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-electric-500/20 transition-all disabled:opacity-50 min-h-[44px]"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Mengunggah & Memproses...' : 'Unggah & Konversi Presentasi'}</span>
        </button>
      </form>

      {/* Live Preview Viewer */}
      {presentation && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white truncate">
              Preview Pemutar Presentasi Anda
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
