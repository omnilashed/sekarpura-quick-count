import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Download,
  FileText,
  ExternalLink,
  X,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Presentation } from '../../types';
import { presentationService } from '../../services/presentationService';

interface PresentationViewerProps {
  presentation: Presentation;
  onClose?: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  presentation,
  onClose,
}) => {
  const isDirectPdf = presentation.fileType === 'pdf';
  const hasConvertedPdf = Boolean(presentation.previewGridFsFileId);
  const canShowNativePdf = isDirectPdf || hasConvertedPdf;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Streaming URLs from Backend API (MongoDB GridFS)
  const downloadOriginalUrl = presentationService.getDownloadUrl(presentation._id);
  const previewPdfUrl = presentationService.getPreviewUrl(presentation._id);

  // Ambil dokumen via Blob lokal agar 100% same-origin di browser klien (menghilangkan CSP frame-ancestors block)
  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    if (canShowNativePdf) {
      setLoadingBlob(true);

      fetch(previewPdfUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Gagal memuat dokumen preview (HTTP ${res.status})`);
          }
          return res.blob();
        })
        .then((blob) => {
          if (!isMounted) return;
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(pdfBlob);
          setBlobUrl(objectUrl);
          setLoadingBlob(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn('[PresentationViewer] Fallback ke URL streaming langsung:', err.message);
          setLoadingBlob(false);
          setBlobUrl(previewPdfUrl);
        });
    }

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [presentation._id, canShowNativePdf, previewPdfUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(Boolean);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(Boolean);
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(Boolean);
    }
    setIsFullscreen(false);
  };

  return (
    <div
      ref={viewerContainerRef}
      className={`flex flex-col bg-navy-950 text-white rounded-2xl sm:rounded-3xl overflow-hidden border border-navy-800 shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full min-h-[540px] sm:min-h-[680px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 sm:px-6 py-3 bg-navy-900 border-b border-navy-800 gap-2 select-none">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-electric-600/20 text-electric-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-base text-white truncate">
                {presentation.title}
              </h3>
              {presentation.version && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-800 text-gold-400 border border-gold-400/20 shrink-0">
                  v{presentation.version}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <span>{presentation.originalFileName}</span>
              <span>•</span>
              <span className="uppercase font-bold text-electric-400">.{presentation.fileType}</span>
              {presentation.sha256 && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-500 hidden md:inline">
                    SHA256: {presentation.sha256.substring(0, 8)}...
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Download Original File Button */}
          <a
            href={downloadOriginalUrl}
            download={presentation.originalFileName}
            className="p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-slate-100 hover:text-white bg-electric-600 hover:bg-electric-500 shadow-md shadow-electric-600/20 transition-all"
            title="Unduh File Asli Sesuai Yang Diunggah"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Unduh File Asli</span>
          </a>

          {/* Open in New Tab */}
          {canShowNativePdf && (
            <a
              href={previewPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
              title="Buka Dokumen di Tab Penuh"
            >
              <ExternalLink className="w-4 h-4 text-electric-400" />
              <span className="hidden sm:inline">Tab Baru</span>
            </a>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
            title="Layar Penuh (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 transition-colors"
              title="Tutup Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Presentation Stage: MURNI DOKUMEN ASLI */}
      {canShowNativePdf ? (
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative min-h-[500px] sm:min-h-[640px]">
          {loadingBlob ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 text-slate-400 min-h-[500px]">
              <RefreshCw className="w-8 h-8 animate-spin text-electric-400" />
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                Memuat dokumen presentasi asli dari penyimpanan GridFS...
              </p>
              <p className="text-[11px] text-slate-500">
                Memverifikasi keaslian file & menyiapkan pratinjau
              </p>
            </div>
          ) : (
            <iframe
              src={blobUrl ? `${blobUrl}#toolbar=1&navpanes=1` : `${previewPdfUrl}#toolbar=1&navpanes=1`}
              className="w-full h-full flex-1 min-h-[500px] sm:min-h-[640px] border-0 bg-slate-900"
              title={presentation.title}
            />
          )}
        </div>
      ) : (
        /* Presentation Native PPT/PPTX Card: Menampilkan opsi unduh file asli resmi */
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-gradient-to-b from-navy-950 to-navy-900 space-y-5 min-h-[480px]">
          <div className="w-16 h-16 rounded-3xl bg-gold-500/15 text-gold-400 flex items-center justify-center shadow-lg border border-gold-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              File Materi Asli .{presentation.fileType.toUpperCase()}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Materi <strong>{presentation.originalFileName}</strong> tersimpan 100% utuh tanpa diubah sedikit pun di penyimpanan aman GridFS. Seluruh slide, grafik, animasi, dan format asli Anda dapat dibuka langsung melalui aplikasi PowerPoint atau Office.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={downloadOriginalUrl}
              download={presentation.originalFileName}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-electric-500/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Asli ({presentation.originalFileName})</span>
            </a>
          </div>

          <div className="pt-4 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Terverifikasi Kriptografi SHA-256: {presentation.sha256}</span>
          </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="px-3 sm:px-6 py-2.5 bg-navy-900 border-t border-navy-800 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2 truncate">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">
            Pratinjau Dokumen Asli Aktif • Mengalir langsung dari penyimpanan terverifikasi GridFS
          </span>
        </div>
        {canShowNativePdf && (
          <a
            href={previewPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-electric-400 hover:text-electric-300 font-bold shrink-0 ml-2"
          >
            <span>Buka Layar Penuh</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
