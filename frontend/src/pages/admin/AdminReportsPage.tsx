import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { ElectionStage } from '../../types';

export const AdminReportsPage: React.FC = () => {
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');

  useEffect(() => {
    electionService.getStages().then((data) => {
      setStages(data);
      if (data.length > 0) setSelectedStageId(data[0]._id);
    });
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Pusat Laporan & Ekspor Dokumen Resmi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Unduh laporan rekapitulasi perolehan suara resmi dalam format PDF, Excel (.xlsx), dan CSV
        </p>
      </div>

      {/* Select Stage */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-5 sm:p-6 shadow-sm flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
          Pilih Tahapan Pemilihan:
        </span>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full xs:w-auto">
          {stages.map((stg) => (
            <button
              key={stg._id}
              onClick={() => setSelectedStageId(stg._id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all text-center min-h-[40px] flex items-center justify-center ${
                selectedStageId === stg._id
                  ? 'bg-electric-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* PDF Report */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3 sm:mb-4">
              <Download className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Dokumen Resmi PDF
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Format siap cetak dengan kop surat resmi SEKARPURA Halim, tabel perolehan suara sah, rincian TPS, dan lembar pengesahan tanda tangan panitia.
            </p>
          </div>
          <button
            onClick={() => quickcountService.downloadReport(selectedStageId, 'pdf')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>

        {/* Excel Report */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 sm:mb-4">
              <FileSpreadsheet className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Lembar Kerja Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Format spreadsheet terstruktur dengan multi-sheet (Sheet Rekapitulasi Suara & Sheet Data Sumber TPS) untuk keperluan audit data internal.
            </p>
          </div>
          <button
            onClick={() => quickcountService.downloadReport(selectedStageId, 'xlsx')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Lembar Excel</span>
          </button>
        </div>

        {/* CSV Report */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 sm:mb-4">
              <Download className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Data Raw Tabulasi (.csv)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Data mentah perolehan suara per TPS yang kompatibel untuk pemrosesan analitika data eksternal, visualisasi, dan integrasi sistem.
            </p>
          </div>
          <button
            onClick={() => quickcountService.downloadReport(selectedStageId, 'csv')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
