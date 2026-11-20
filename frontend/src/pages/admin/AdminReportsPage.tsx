import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Clock, Printer, RotateCcw } from 'lucide-react';
import { quickcountService } from '../../services/quickcountService';
import { electionService } from '../../services/electionService';
import { ElectionStage } from '../../types';
import { formatWibDateTime } from '../../utils/date';

export const AdminReportsPage: React.FC = () => {
  const [stages, setStages] = useState<ElectionStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'xlsx' | 'csv' | null>(null);

  useEffect(() => {
    electionService.getStages().then((data) => {
      setStages(data);
      if (data.length > 0) setSelectedStageId(data[0]._id);
    });
  }, []);

  const handleDownload = async (format: 'pdf' | 'xlsx' | 'csv') => {
    if (!selectedStageId) return;
    try {
      setDownloadingFormat(format);
      await quickcountService.downloadReport(selectedStageId, format);
    } catch (err) {
      console.error('Failed to download report:', err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Print-Only Official Header */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-wider text-slate-900">
              SEKARPURA CABANG BANDARA HALIM PERDANAKUSUMA
            </h1>
            <p className="text-xs text-slate-700">
              Pusat Dokumen Laporan & Berita Acara Rekapitulasi Pemilihan
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p>Waktu Cetak: {formatWibDateTime()}</p>
            <p className="text-[10px] text-slate-500">Zona Waktu: Asia/Jakarta (WIB / UTC+7)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white leading-tight">
            Pusat Laporan & Ekspor Dokumen Resmi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unduh laporan rekapitulasi perolehan suara resmi dalam format PDF, Excel (.xlsx), dan CSV
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-sm"
          title="Cetak Ringkasan Halaman Ini (WIB UTC+7)"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Cetak Halaman</span>
        </button>
      </div>

      {/* Timezone Info Banner */}
      <div className="bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-navy-800 p-3 xs:p-4 rounded-2xl flex items-center gap-3 text-xs">
        <Clock className="w-4 h-4 text-gold-500 shrink-0" />
        <span className="text-slate-600 dark:text-slate-300">
          Standarisasi Waktu Seluruh Dokumen & Cetak: <strong>Waktu Indonesia Barat (WIB / UTC+7, Bagian Jakarta/Indonesia)</strong>. Seluruh tanggal dan jam pada berkas tertera secara resmi dalam zona waktu Jakarta.
        </span>
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
              Dokumen Resmi PDF (Siap Cetak)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Format siap cetak dengan kop surat resmi SEKARPURA Halim, tabel perolehan suara sah, rincian TPS, lembar pengesahan saksi/panitia, dan stempel waktu resmi <strong>WIB (Jakarta)</strong>.
            </p>
          </div>
          <button
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('pdf')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            {downloadingFormat === 'pdf' ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadingFormat === 'pdf' ? 'Mengunduh...' : 'Unduh Laporan PDF'}</span>
          </button>
        </div>

        {/* Excel Report */}
        <div className="p-4 xs:p-5 sm:p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 sm:mb-4">
              <FileSpreadsheet className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
              Buku Kerja Excel (.xlsx)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Format spreadsheet 4-sheet lengkap (Ringkasan & Penetapan, Putaran 1, Putaran 2, Matriks TPS) dengan waktu pencetakan resmi <strong>WIB (UTC+7)</strong>.
            </p>
          </div>
          <button
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('xlsx')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            {downloadingFormat === 'xlsx' ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadingFormat === 'xlsx' ? 'Mengunduh...' : 'Unduh Lembar Excel'}</span>
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
              Format CSV UTF-8 BOM yang memuat seluruh metadata putaran 1 & 2 dengan catatan waktu pembuatan terstandarisasi <strong>WIB (Jakarta)</strong>.
            </p>
          </div>
          <button
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('csv')}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            {downloadingFormat === 'csv' ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloadingFormat === 'csv' ? 'Mengunduh...' : 'Unduh File CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
