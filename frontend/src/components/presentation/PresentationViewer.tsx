import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Sidebar,
  FileText,
  X,
} from 'lucide-react';
import { Presentation, SlideData } from '../../types';
import { BASE_URL } from '../../services/api';

interface PresentationViewerProps {
  presentation: Presentation;
  onClose?: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ presentation, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playInterval, setPlayInterval] = useState(5); // seconds
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showThumbnails, setShowThumbnails] = useState(false); // default closed on mobile

  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const slides: SlideData[] =
    presentation.slidesData && presentation.slidesData.length > 0
      ? presentation.slidesData
      : [
          {
            slideNumber: 1,
            title: presentation.title,
            content: presentation.description || 'Pemaparan gagasan dan materi kampanye kandidat.',
          },
        ];

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        nextSlide();
      }, playInterval * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playInterval, currentSlideIndex, slides.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, currentSlideIndex, slides.length]);

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

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.8));
  const handleResetZoom = () => setZoomLevel(1);

  const downloadOriginalUrl = `${BASE_URL}/uploads/${presentation.originalFileKey}`;

  return (
    <div
      ref={viewerContainerRef}
      className={`flex flex-col bg-navy-950 text-white rounded-2xl sm:rounded-3xl overflow-hidden border border-navy-800 shadow-2xl transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full min-h-[460px] sm:min-h-[560px]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 bg-navy-900 border-b border-navy-800 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-electric-600/20 text-electric-400 flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-base text-white truncate">
              {presentation.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Slide {currentSlideIndex + 1} dari {slides.length} • .{presentation.fileType.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Toggle Thumbnails */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showThumbnails ? 'bg-navy-800 text-electric-400' : 'text-slate-400 hover:bg-navy-800'
            }`}
            title="Daftar Slide"
          >
            <Sidebar className="w-4 h-4" />
            <span className="hidden md:inline">Daftar Slide</span>
          </button>

          {/* Download Original File */}
          <a
            href={downloadOriginalUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
            title="Unduh File Asli"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Unduh</span>
          </a>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 transition-colors"
            title="Layar Penuh (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Presentation Stage & Thumbnails Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar / Mobile Overlay Drawer */}
        {showThumbnails && (
          <div className="absolute inset-y-0 left-0 z-30 w-52 sm:w-60 bg-navy-950/98 backdrop-blur-md border-r border-navy-800 p-3 overflow-y-auto space-y-2 select-none shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-navy-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Navigasi Slide
              </p>
              <button
                onClick={() => setShowThumbnails(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  if (window.innerWidth < 768) setShowThumbnails(false);
                }}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                  idx === currentSlideIndex
                    ? 'bg-electric-600/20 border-electric-500 text-white shadow-sm'
                    : 'bg-navy-900 border-navy-800 text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-70">
                  <span>Slide {s.slideNumber || idx + 1}</span>
                  {idx === currentSlideIndex && <span className="w-1.5 h-1.5 rounded-full bg-electric-400" />}
                </div>
                <p className="font-semibold truncate">{s.title || `Slide ${idx + 1}`}</p>
              </button>
            ))}
          </div>
        )}

        {/* Presentation Slide Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto bg-gradient-to-b from-navy-950 to-navy-900">
          <div
            className="w-full max-w-4xl aspect-[16/9] min-h-[220px] bg-[#0B1630] rounded-xl sm:rounded-2xl border border-navy-700 shadow-2xl flex flex-col justify-between p-4 sm:p-8 transition-transform duration-200 relative overflow-hidden"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Top Accent line & Header */}
            <div>
              <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-gradient-to-r from-gold-500 via-electric-500 to-gold-400" />
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-gold-400 font-bold tracking-wider uppercase mb-2 sm:mb-4 pt-1">
                <span className="truncate max-w-[170px] sm:max-w-none">SEKARPURA HALIM</span>
                <span>SLIDE {currentSlide.slideNumber || currentSlideIndex + 1} / {slides.length}</span>
              </div>

              {/* Slide Title */}
              <h2 className="text-base 2xs:text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-tight mb-2 sm:mb-4 line-clamp-2">
                {currentSlide.title || `Slide ${currentSlide.slideNumber || currentSlideIndex + 1}`}
              </h2>

              <div className="h-0.5 w-full bg-navy-800 mb-3 sm:mb-5" />

              {/* Slide Bullets / Content */}
              {currentSlide.bullets && currentSlide.bullets.length > 0 ? (
                <ul className="space-y-2 sm:space-y-3.5">
                  {currentSlide.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-base text-slate-200 leading-relaxed">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold-400 mt-1.5 shrink-0" />
                      <span className="line-clamp-3 sm:line-clamp-none">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-base text-slate-300 leading-relaxed whitespace-pre-line line-clamp-6 sm:line-clamp-none">
                  {currentSlide.content}
                </p>
              )}
            </div>

            {/* Slide Footer */}
            <div className="mt-4 sm:mt-6 pt-2 sm:pt-4 border-t border-navy-800 flex items-center justify-between text-[9px] sm:text-xs text-slate-500">
              <span className="truncate max-w-[200px] sm:max-w-none">Materi Pemaparan Calon Ketua DPC SEKARPURA Halim</span>
              <span className="font-semibold text-slate-400 shrink-0">Official Deck</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Toolbar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-navy-900 border-t border-navy-800 flex flex-wrap items-center justify-between gap-2 sm:gap-4 select-none">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={prevSlide}
            className="p-1.5 sm:p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 transition-colors"
            title="Slide Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 bg-navy-950 rounded-lg border border-navy-800 whitespace-nowrap">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          <button
            onClick={nextSlide}
            className="p-1.5 sm:p-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 transition-colors"
            title="Slide Selanjutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Autoplay & Interval Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-navy-800 hover:bg-navy-700 text-slate-300'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{isPlaying ? 'Pause' : 'Auto'}</span>
          </button>

          <select
            value={playInterval}
            onChange={(e) => setPlayInterval(Number(e.target.value))}
            className="bg-navy-950 border border-navy-800 rounded-lg text-xs px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value={3}>3s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </div>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center gap-1 text-slate-300">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700"
            title="Perkecil"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-navy-800 hover:bg-navy-700"
            title="Reset Zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700"
            title="Perbesar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
