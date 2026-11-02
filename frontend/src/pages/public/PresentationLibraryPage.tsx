import React, { useEffect, useState } from 'react';
import { Presentation as PresIcon, X } from 'lucide-react';
import { presentationService } from '../../services/presentationService';
import { Presentation } from '../../types';
import { PresentationCard } from '../../components/presentation/PresentationCard';
import { PresentationViewer } from '../../components/presentation/PresentationViewer';

export const PresentationLibraryPage: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);

  useEffect(() => {
    fetchLibrary();
  }, [stageFilter]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const stageParam = stageFilter === 'ALL' ? undefined : stageFilter;
      const data = await presentationService.getLibrary(stageParam);
      setPresentations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 text-xs font-bold uppercase mb-3">
              <PresIcon className="w-3.5 h-3.5" />
              <span>DIGITAL CAMPAIGN LIBRARY</span>
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white leading-tight">
              Presentasi & Gagasan Kandidat
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Kumpulan materi pemaparan visi, misi, dan program kerja para calon ketua SEKARPURA Halim. Putar dan pelajari komitmen masing-masing kandidat secara interaktif.
            </p>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-navy-800 p-1.5 rounded-2xl border border-slate-200 dark:border-navy-700 w-full sm:w-auto self-start">
            <button
              onClick={() => setStageFilter('ALL')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[40px] flex items-center justify-center ${
                stageFilter === 'ALL'
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              Semua Tahap
            </button>
            <button
              onClick={() => setStageFilter('STAGE_2')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[40px] flex items-center justify-center ${
                stageFilter === 'STAGE_2'
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              Calon Definitif
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Top Viewer when active */}
      {selectedPresentation && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 dark:text-white truncate">
              Pemutar Presentasi Interaktif
            </h2>
            <button
              onClick={() => setSelectedPresentation(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors shrink-0 min-h-[38px]"
            >
              <X className="w-4 h-4" />
              <span>Tutup Pemutar</span>
            </button>
          </div>
          <PresentationViewer presentation={selectedPresentation} />
        </div>
      )}

      {/* Grid of Presentations */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200 dark:bg-navy-900 animate-pulse" />
          ))}
        </div>
      ) : presentations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {presentations.map((presentation) => (
            <PresentationCard
              key={presentation._id}
              presentation={presentation}
              onOpenViewer={(pres) => {
                setSelectedPresentation(pres);
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 p-6">
          <p className="text-sm font-bold text-slate-500">
            Belum ada presentasi yang dipublikasikan untuk filter ini.
          </p>
        </div>
      )}
    </div>
  );
};
