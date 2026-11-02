import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckCircle2, Award } from 'lucide-react';

export const CandidateStatusPage: React.FC = () => {
  const { user } = useAuthStore();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.candidateId) {
      candidateService.getById(user.candidateId).then((data) => {
        setCandidate(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return <div className="py-20 text-center text-sm">Memuat status...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Status Pencalonan & Tahapan Pemilihan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pantau status verifikasi berkas, persetujuan admin, dan penetapan kualifikasi tahap pemilihan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Verifikasi Berkas */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                Verifikasi Data Profil
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Persetujuan Panitia Pemilihan</p>
            </div>
          </div>

          <div className="pt-1 sm:pt-2">
            <StatusBadge status={candidate?.verificationStatus || 'PENDING'} type="verification" />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {candidate?.verificationStatus === 'VERIFIED'
              ? 'Seluruh data profil dan visi misi Anda telah diverifikasi oleh Panitia dan memenuhi syarat pencalonan resmi.'
              : candidate?.verificationStatus === 'REJECTED'
              ? `Pengajuan data Anda ditolak: ${candidate?.rejectionReason || 'Periksa kembali kelengkapan profil Anda.'}`
              : 'Data profil Anda sedang dalam proses penelaahan oleh panitia pengawas pemilihan.'}
          </p>
        </div>

        {/* Card 2: Kualifikasi Tahap 2 */}
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-8 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-2xl bg-gold-500/10 text-gold-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                Kualifikasi Tahap 2
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Calon Ketua Definitif</p>
            </div>
          </div>

          <div className="pt-1 sm:pt-2">
            <StatusBadge status={candidate?.candidacyStatus || 'BAKAL_CALON'} type="candidacy" />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {candidate?.stage2Qualified
              ? 'Selamat! Anda resmi ditetapkan lolos dari tahap penjaringan pertama untuk melaju ke tahap pemilihan ketua definitif.'
              : 'Saat ini proses pemungutan dan rekapitulasi tahap 1 sedang berjalan. Peringkat 5 teratas akan melaju ke tahap 2.'}
          </p>
        </div>
      </div>
    </div>
  );
};
