import React from 'react';
import { Presentation as PresentationType } from '../../types';
import { Presentation, Layers, Calendar, ArrowRight } from 'lucide-react';
import { BASE_URL } from '../../services/api';
import { formatWibDate } from '../../utils/date';

interface PresentationCardProps {
  presentation: PresentationType;
  onOpenViewer: (presentation: PresentationType) => void;
}

export const PresentationCard: React.FC<PresentationCardProps> = ({ presentation, onOpenViewer }) => {
  const candidate = presentation.candidateId;
  const photoSrc = candidate?.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  const uploadDate = formatWibDate(presentation.uploadedAt);

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Candidate Info Header */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={photoSrc}
            alt={candidate?.fullName || 'Kandidat'}
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-navy-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.svg';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/30">
                No. {candidate?.candidateNumber || '-'}
              </span>
              <h4 className="font-extrabold text-sm text-navy-900 dark:text-white truncate">
                {candidate?.fullName || 'Calon Ketua'}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {candidate?.position || 'Insan Angkasa Pura'}
            </p>
          </div>
        </div>

        {/* Presentation Title & Description */}
        <div className="mb-4">
          <h3 className="font-extrabold text-base text-navy-900 dark:text-white group-hover:text-electric-500 transition-colors line-clamp-2">
            {presentation.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
            {presentation.description || 'Pemaparan gagasan program kerja dan visi organisasi.'}
          </p>
        </div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-6">
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 px-2.5 py-1 rounded-lg">
            <Layers className="w-3.5 h-3.5 text-electric-500" />
            <span>{presentation.slideCount} Slide</span>
          </span>
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-navy-800 px-2.5 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
            <span>{uploadDate}</span>
          </span>
          <span className="uppercase text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-navy-800">
            .{presentation.fileType}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onOpenViewer(presentation)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-600 text-white font-bold text-xs shadow-md shadow-electric-500/20 transition-all"
      >
        <Presentation className="w-4 h-4 text-gold-400" />
        <span>Buka Presentasi</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
