import React, { useEffect, useState } from 'react';
import { Search, Users, Filter } from 'lucide-react';
import { candidateService } from '../../services/candidateService';
import { Candidate } from '../../types';
import { CandidateCard } from '../../components/candidate/CandidateCard';

export const BakalCalonPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');

  useEffect(() => {
    fetchCandidates();
  }, [search]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await candidateService.getAll({
        publicationStatus: 'PUBLISHED',
        search: search || undefined,
      });
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const workUnits = Array.from(new Set(candidates.map((c) => c.workUnit).filter(Boolean)));

  const filteredCandidates = candidates.filter((c) => {
    if (unitFilter !== 'ALL' && c.workUnit !== unitFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-10 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400 text-xs font-bold uppercase mb-3">
          <Users className="w-3.5 h-3.5" />
          <span>TAHAP 1 - PENJARINGAN</span>
        </div>
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Direktori Bakal Calon Ketua SEKARPURA
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
          Daftar seluruh kader dan insan pekerja Bandara Halim Perdanakusuma yang mendaftarkan diri serta terverifikasi resmi mengikuti proses penjaringan pemilihan ketua serikat masa bakti 2026-2029.
        </p>

        {/* Filter & Search Bar */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, nomor urut, atau jabatan..."
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full sm:w-auto py-2.5 sm:py-3 px-3 sm:px-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-electric-500 min-h-[44px]"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {workUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Candidates */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-72 rounded-3xl bg-slate-200 dark:bg-navy-900 animate-pulse"
            />
          ))}
        </div>
      ) : filteredCandidates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredCandidates.map((candidate) => (
            <CandidateCard key={candidate._id} candidate={candidate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 p-6">
          <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
            Tidak ada bakal calon yang sesuai dengan kriteria pencarian.
          </p>
        </div>
      )}
    </div>
  );
};
