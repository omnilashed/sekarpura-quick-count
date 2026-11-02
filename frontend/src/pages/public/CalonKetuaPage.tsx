import React, { useEffect, useState } from 'react';
import { Award, Shield } from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { CandidateCard } from '../../components/candidate/CandidateCard';

export const CalonKetuaPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    candidateService
      .getAll({ stage: 'STAGE_2', publicationStatus: 'PUBLISHED' })
      .then((res) => setCandidates(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 border border-slate-700/60 rounded-3xl p-5 xs:p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs font-bold uppercase mb-3">
            <Award className="w-3.5 h-3.5" />
            <span>TAHAP 2 - CALON KETUA DEFINITIF</span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Calon Ketua Definitif Terpilih
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Daftar kandidat yang resmi dinyatakan lolos dari tahap penjaringan pertama untuk melaju ke pemilihan tahap final ketua SEKARPURA Cabang Halim Perdanakusuma.
          </p>
        </div>
      </div>

      {/* Grid of Final Candidates */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-slate-200 dark:bg-navy-900 animate-pulse" />
          ))}
        </div>
      ) : candidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate._id} candidate={candidate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 p-6 sm:p-8">
          <Shield className="w-10 sm:w-12 h-10 sm:h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
            Tahap 2 Belum Ditetapkan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Proses penjaringan tahap pertama masih berlangsung atau calon definitif sedang dalam proses verifikasi penetapan panitia.
          </p>
        </div>
      )}
    </div>
  );
};
