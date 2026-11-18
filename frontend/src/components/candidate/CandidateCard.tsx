import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Briefcase, Building, ChevronRight, Presentation as PresIcon } from 'lucide-react';
import { Candidate } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BASE_URL } from '../../services/api';

interface CandidateCardProps {
  candidate: Candidate;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const photoSrc = candidate.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  return (
    <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-xl hover:border-electric-500/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges: Number Urut & Status */}
        <div className="flex items-center justify-between gap-1.5 mb-3 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-navy-900 to-navy-800 dark:from-electric-600 dark:to-electric-500 text-gold-400 font-black text-xs sm:text-sm flex items-center justify-center shadow-sm border border-gold-500/30">
              #{candidate.candidateNumber}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
              No. Urut
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 justify-end">
            {candidate.willingnessStatement && (
              <StatusBadge status={candidate.willingnessStatement} />
            )}
            <StatusBadge status={candidate.candidacyStatus} type="candidacy" />
          </div>
        </div>

        {/* Candidate Photo & Basic Info */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-navy-700 shrink-0 bg-slate-100 dark:bg-navy-800 shadow-inner">
            <img
              src={photoSrc}
              alt={candidate.fullName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white leading-tight truncate">
              {candidate.fullName}
            </h3>
            <p className="text-[11px] sm:text-xs font-bold text-gold-600 dark:text-gold-400 mt-0.5 truncate">
              "{candidate.nickname}"
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="truncate">{candidate.position}</span>
            </p>
          </div>
        </div>

        {/* Work Unit & Tenure */}
        <div className="bg-slate-50 dark:bg-navy-800/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 space-y-0.5 sm:space-y-1 mb-3 sm:mb-4 border border-slate-100 dark:border-navy-700/60">
          <div className="flex items-center gap-1.5">
            <Building className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.workUnit}</span>
          </div>
          {candidate.tenure && (
            <p className="text-[10px] sm:text-[11px] text-slate-400 pl-4">
              Masa Kerja: <strong className="text-slate-700 dark:text-slate-200">{candidate.tenure}</strong>
            </p>
          )}
        </div>

        {/* Vision Quote */}
        {candidate.vision && (
          <div className="mb-4 sm:mb-6">
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
              "{candidate.vision}"
            </p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
        <Link
          to={`/kandidat/${candidate._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-electric-600 hover:text-white text-navy-900 dark:text-slate-200 font-bold text-xs transition-all group/btn"
        >
          <span>Profil Lengkap</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
