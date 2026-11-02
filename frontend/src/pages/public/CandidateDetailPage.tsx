import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building,
  Target,
  FileText,
  Clock,
  Award,
  Presentation,
  CheckCircle,
  MessageSquare,
  Shield,
  Heart,
} from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PresentationViewer } from '../../components/presentation/PresentationViewer';
import { BASE_URL } from '../../services/api';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      candidateService
        .getById(id)
        .then((res) => setCandidate(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-electric-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Profil kandidat tidak ditemukan.</h2>
        <Link to="/" className="text-electric-500 underline mt-4 inline-block">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const photoSrc = candidate.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  const presentation = candidate.presentationId as any;

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Back button */}
      <Link
        to="/bakal-calon"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Direktori Kandidat</span>
      </Link>

      {/* Hero Profile Banner */}
      <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 border border-slate-700/60 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative z-10">
          {/* High-res Photo */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 2xs:w-36 2xs:h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-4 border-gold-500/40 p-1 bg-navy-800 shadow-2xl">
              <img
                src={photoSrc}
                alt={candidate.fullName}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 sm:px-4 py-1 rounded-full bg-gold-400 text-navy-950 font-black text-[11px] sm:text-xs shadow-lg uppercase tracking-wider whitespace-nowrap">
              No. Urut {candidate.candidateNumber}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-2.5 sm:space-y-3 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <StatusBadge status={candidate.candidacyStatus} type="candidacy" />
              <StatusBadge status={candidate.verificationStatus} type="verification" />
            </div>

            <h1 className="text-xl 2xs:text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              {candidate.fullName}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-gold-400">
              Panggilan Akrab: "{candidate.nickname}"
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span className="truncate max-w-[200px] xs:max-w-none">{candidate.position}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-electric-400 shrink-0" />
                <span className="truncate max-w-[200px] xs:max-w-none">{candidate.workUnit}</span>
              </span>
              {candidate.tenure && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                  <span>Masa Kerja: {candidate.tenure}</span>
                </span>
              )}
            </div>

            {candidate.biography && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-2 max-w-2xl">
                {candidate.biography}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Visi & Misi, Program Kerja, Pengalaman, Harapan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Visi & Misi & Pesan */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Visi Section */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <div className="w-8 h-8 rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Visi Calon Ketua
              </h2>
            </div>
            <p className="text-xs sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed italic bg-gold-500/5 dark:bg-gold-500/10 p-4 sm:p-5 rounded-2xl border-l-4 border-gold-500">
              "{candidate.vision || 'Visi belum diisi oleh kandidat.'}"
            </p>
          </div>

          {/* Misi Section */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Misi Utama Organisasi
              </h2>
            </div>
            {candidate.mission && candidate.mission.length > 0 ? (
              <ul className="space-y-3">
                {candidate.mission.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-electric-500/15 text-electric-600 dark:text-electric-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Misi belum dicantumkan.</p>
            )}
          </div>

          {/* Program Kerja Unggulan */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white">
                Program Prioritas & Kerja Unggulan
              </h2>
            </div>

            {candidate.programs && candidate.programs.length > 0 ? (
              <div className="space-y-3.5 sm:space-y-4">
                {candidate.programs.map((prog, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200 dark:border-navy-700"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] sm:text-xs font-bold text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2 py-0.5 rounded">
                        Program #{prog.priority || pIdx + 1}
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-navy-900 dark:text-white">
                        {prog.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {prog.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Program kerja belum diisi.</p>
            )}
          </div>
        </div>

        {/* Right Column: Pengalaman, Harapan, Pesan Kampanye */}
        <div className="space-y-6 sm:space-y-8">
          {/* Campaign Message Box */}
          {candidate.campaignMessage && (
            <div className="bg-gradient-to-br from-gold-500/15 via-gold-500/5 to-transparent border border-gold-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <MessageSquare className="w-4 h-4 text-gold-500" />
                <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-gold-400 uppercase tracking-wider">
                  Pesan Kepada Anggota
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                "{candidate.campaignMessage}"
              </p>
            </div>
          )}

          {/* Harapan terhadap SEKARPURA */}
          {candidate.expectations && (
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Heart className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white">
                  Harapan Terhadap Organisasi
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {candidate.expectations}
              </p>
            </div>
          )}

          {/* Riwayat Organisasi & Kepemimpinan */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Award className="w-4 h-4 text-electric-500" />
              <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white">
                Pengalaman Organisasi & Kepemimpinan
              </h3>
            </div>

            {candidate.experience && candidate.experience.length > 0 ? (
              <div className="space-y-3">
                {candidate.experience.map((exp, eIdx) => (
                  <div key={eIdx} className="text-xs border-l-2 border-slate-300 dark:border-navy-700 pl-3 py-0.5">
                    <p className="font-bold text-navy-900 dark:text-white">{exp.role}</p>
                    <p className="text-slate-500 dark:text-slate-400">{exp.organization} • {exp.period}</p>
                    {exp.description && <p className="text-[11px] text-slate-400 mt-0.5">{exp.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada riwayat tercatat.</p>
            )}

            {candidate.leadershipExperience && (
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-navy-800 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-200">Catatan Kepemimpinan:</strong> {candidate.leadershipExperience}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Presentation Viewer on Candidate Page */}
      {presentation && typeof presentation === 'object' && (
        <section className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-navy-800">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-extrabold text-navy-900 dark:text-white">
              Pemaparan Materi Presentasi Kandidat
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Telusuri slide gagasan dan rencana strategis calon ketua secara interaktif
            </p>
          </div>
          <PresentationViewer presentation={presentation} />
        </section>
      )}
    </div>
  );
};
