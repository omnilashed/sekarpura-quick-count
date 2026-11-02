import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircle,
  Target,
  FileText,
  Presentation,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BASE_URL } from '../../services/api';

export const CandidateDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    if (user?.candidateId) {
      candidateService
        .getById(user.candidateId)
        .then((res) => setCandidate(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const photoSrc = candidate?.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  // Completion calculation
  const getCompletionPercentage = () => {
    if (!candidate) return 50;
    let score = 0;
    if (candidate.fullName) score += 15;
    if (candidate.position) score += 15;
    if (candidate.profilePhoto && !candidate.profilePhoto.includes('default')) score += 15;
    if (candidate.vision) score += 15;
    if (candidate.mission && candidate.mission.length > 0) score += 15;
    if (candidate.programs && candidate.programs.length > 0) score += 15;
    if (candidate.presentationId) score += 10;
    return Math.min(score, 100);
  };

  const completion = getCompletionPercentage();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border border-slate-700/60 rounded-3xl p-4 xs:p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-gold-500/40 shrink-0 bg-navy-800 p-0.5">
            <img
              src={photoSrc}
              alt={candidate?.fullName || 'Kandidat'}
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
              <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded bg-gold-400 text-navy-950">
                No. Urut {candidate?.candidateNumber || '-'}
              </span>
              <StatusBadge status={candidate?.candidacyStatus || 'BAKAL_CALON'} type="candidacy" />
            </div>
            <h1 className="text-lg xs:text-xl sm:text-2xl font-extrabold truncate">{candidate?.fullName || user?.name}</h1>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
              {candidate?.position} • {candidate?.workUnit}
            </p>
          </div>
        </div>

        {/* Completion Indicator */}
        <div className="bg-navy-900/80 p-3 sm:p-4 rounded-2xl border border-slate-700 w-full md:w-auto md:min-w-[200px] text-left md:text-right">
          <div className="flex md:block items-center justify-between">
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Kelengkapan Profil</p>
            <p className="text-xl sm:text-2xl font-black text-gold-400 md:mt-0.5">{completion}%</p>
          </div>
          <div className="w-full bg-navy-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-gold-500 to-amber-300 h-2 rounded-full"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Link
          to="/candidate/profile"
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-electric-500/50 transition-all flex flex-col justify-between group min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-electric-500/10 text-electric-600 dark:text-electric-400 flex items-center justify-center">
              <UserCircle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
              Data Pribadi & Biodata
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Perbarui jabatan, unit kerja, masa kerja, dan foto resmi
            </p>
          </div>
        </Link>

        <Link
          to="/candidate/vision-mission"
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-gold-500/50 transition-all flex flex-col justify-between group min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
              Visi & Misi Serikat
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Rumusan gagasan dan pokok kebijakan bagi anggota
            </p>
          </div>
        </Link>

        <Link
          to="/candidate/programs"
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-emerald-500/50 transition-all flex flex-col justify-between group min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
              Program Kerja Unggulan
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Daftar program prioritas 100 hari dan rencana jangka panjang
            </p>
          </div>
        </Link>

        <Link
          to="/candidate/presentation"
          className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm hover:border-purple-500/50 transition-all flex flex-col justify-between group min-h-[140px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Presentation className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
              File Materi Presentasi
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Unggah PPT/PDF pemaparan yang akan ditampilkan ke publik
            </p>
          </div>
        </Link>
      </div>

      {/* Candidacy Status Details */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm">
        <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white mb-4">
          Status Verifikasi & Publikasi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60">
            <p className="text-slate-400 mb-1">Verifikasi Berkas</p>
            <StatusBadge status={candidate?.verificationStatus || 'PENDING'} type="verification" />
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60">
            <p className="text-slate-400 mb-1">Publikasi Profil</p>
            <StatusBadge status={candidate?.publicationStatus || 'DRAFT'} />
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700/60">
            <p className="text-slate-400 mb-1">Kualifikasi Tahap 2</p>
            <span
              className={`font-bold ${
                candidate?.stage2Qualified ? 'text-emerald-500' : 'text-slate-500'
              }`}
            >
              {candidate?.stage2Qualified ? '✓ Lolos Calon Definitif' : 'Tahap Penjaringan'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
