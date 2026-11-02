import React, { useEffect, useState } from 'react';
import { Presentation, Layers, Eye, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { presentationService } from '../../services/presentationService';
import { Presentation as PresentationType } from '../../types';
import { PresentationViewer } from '../../components/presentation/PresentationViewer';

export const AdminPresentationsPage: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPresentation, setPreviewPresentation] = useState<PresentationType | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      const data = await presentationService.getLibrary();
      setPresentations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (p: PresentationType) => {
    const nextStatus = p.publicationStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await presentationService.updateStatus(p._id, nextStatus as any);
      setMessage({ type: 'success', text: `Status presentasi diubah menjadi ${nextStatus}.` });
      loadPresentations();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal memperbarui status presentasi.' });
    }
  };

  const handleDelete = async (p: PresentationType) => {
    if (!window.confirm(`Hapus materi presentasi "${p.title}"?`)) return;
    try {
      await presentationService.delete(p._id);
      setMessage({ type: 'success', text: 'Materi presentasi berhasil dihapus.' });
      loadPresentations();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Gagal menghapus presentasi.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">
          Manajemen Materi Presentasi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Daftar materi PowerPoint dan PDF yang diunggah kandidat, status konversi slide, dan kontrol publikasi
        </p>
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

      {/* Preview Modal */}
      {previewPresentation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold">Preview Penampil Materi</h2>
            <button
              onClick={() => setPreviewPresentation(null)}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-navy-800"
            >
              <X className="w-4 h-4" />
              <span>Tutup Preview</span>
            </button>
          </div>
          <PresentationViewer presentation={previewPresentation} />
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-navy-950/40">
                <th className="py-3 px-4">Kandidat</th>
                <th className="py-3 px-4">Judul Presentasi</th>
                <th className="py-3 px-4">Format & Slide</th>
                <th className="py-3 px-4">Konversi</th>
                <th className="py-3 px-4">Publikasi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800 font-medium">
              {presentations.map((p: any) => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-xs text-navy-900 dark:text-white">
                    {p.candidateId?.fullName || 'Kandidat'}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {p.title}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    .{p.fileType?.toUpperCase()} ({p.slideCount} Slide)
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-xs font-bold ${
                        p.conversionStatus === 'COMPLETED'
                          ? 'text-emerald-500'
                          : p.conversionStatus === 'PROCESSING'
                          ? 'text-amber-500 animate-pulse'
                          : 'text-rose-500'
                      }`}
                    >
                      {p.conversionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.publicationStatus === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-200 dark:bg-navy-800 text-slate-400'
                      }`}
                    >
                      {p.publicationStatus === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setPreviewPresentation(p);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg text-electric-600 hover:bg-electric-50 dark:hover:bg-navy-800"
                        title="Buka Viewer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-800"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
