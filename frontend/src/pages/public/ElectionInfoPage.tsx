import React from 'react';
import { Info, Calendar, ShieldCheck, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export const ElectionInfoPage: React.FC = () => {
  const stagesSchedule = [
    {
      stage: 'Tahap 1: Pendaftaran & Verifikasi Berkas',
      date: '10 - 20 Oktober 2026',
      status: 'Selesai',
      desc: 'Pendaftaran seluruh bakal calon ketua dan verifikasi kelengkapan syarat administratif keanggotaan serikat.',
    },
    {
      stage: 'Tahap 2: Kampanye & Uji Gagasan Terbuka',
      date: '21 - 28 Oktober 2026',
      status: 'Selesai',
      desc: 'Pemaparan materi presentasi visi, misi, dan program kerja unggulan di hadapan anggota serikat.',
    },
    {
      stage: 'Tahap 3: Pemungutan & QuickCount Tahap 1',
      date: '2 November 2026',
      status: 'Sedang Berlangsung',
      desc: 'Pemilihan tahap penjaringan bakal calon dan rekapitulasi cepat untuk menentukan 5 calon definitif.',
    },
    {
      stage: 'Tahap 4: Pemilihan Calon Ketua Definitif',
      date: '4 November 2026',
      status: 'Mendatang',
      desc: 'Pemilihan final penentuan Ketua SEKARPURA Cabang Halim Perdanakusuma Masa Bakti 2026-2029.',
    },
    {
      stage: 'Tahap 5: Penetapan & Pelantikan Pengurus',
      date: '10 November 2026',
      status: 'Mendatang',
      desc: 'Penyerahan mandat kepengurusan resmi dan pelantikan dewan pengurus cabang terpilih.',
    },
  ];

  const rulesList = [
    'Pemilih sah adalah seluruh anggota serikat pekerja yang terdaftar aktif di DPC SEKARPURA Bandara Halim Perdanakusuma.',
    'Proses perhitungan suara di tiap TPS disaksikan secara terbuka oleh saksi resmi kandidat dan panitia pengawas.',
    'Formulir Berita Acara (C1 plano serikat) yang telah ditandatangani bersama menjadi dasar input QuickCount.',
    'Segala bentuk koreksi hasil suara wajib menyertakan bukti fisik Berita Acara dan alasan revisi tertulis.',
    'Penetapan pemenang definitif disahkan dalam Rapat Pleno Panitia Pemilihan Cabang.',
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-10 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-400 text-xs font-bold uppercase mb-3">
          <Info className="w-3.5 h-3.5" />
          <span>INFORMASI & PEDOMAN RESMI</span>
        </div>
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white leading-tight">
          Tahapan & Ketentuan Pemilihan SEKARPURA
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          Pedoman pelaksanaan Musyawarah Cabang dan Pemilihan Ketua Serikat Pekerja Angkasa Pura Indonesia Cabang Halim Perdanakusuma Masa Bakti 2026-2029.
        </p>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-gold-500" />
          <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 dark:text-white">
            Jadwal & Agenda Pelaksanaan
          </h2>
        </div>

        <div className="relative border-l-2 border-slate-200 dark:border-navy-700 ml-2 xs:ml-3 space-y-6 sm:space-y-8 pl-4 sm:pl-6">
          {stagesSchedule.map((item, idx) => (
            <div key={idx} className="relative">
              <span className="absolute -left-[23px] sm:-left-[31px] top-1 w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-electric-600 border-2 sm:border-4 border-white dark:border-navy-900" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="font-extrabold text-sm sm:text-base text-navy-900 dark:text-white">
                  {item.stage}
                </h3>
                <span className="text-[10px] sm:text-xs font-bold text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  {item.date}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules & Integrity Policy */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 dark:text-white">
            Ketentuan Integritas & Transparansi
          </h2>
        </div>

        <ul className="space-y-3 sm:space-y-4">
          {rulesList.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Secretariat Contact Card */}
      <div className="bg-navy-900 text-white border border-navy-800 rounded-3xl p-4 xs:p-6 sm:p-8 shadow-sm">
        <h3 className="text-base sm:text-lg font-bold mb-4 text-gold-400">
          Sekretariat Panitia Pemilihan Cabang Halim
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Alamat Sekretariat</p>
              <p>Gedung Administrasi Lt. 2, Bandara Halim Perdanakusuma, Jakarta Timur</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Surat Elektronik</p>
              <p>panitia@sekarpura-halim.org</p>
            </div>
          </div>
          <div className="flex items-start gap-3 sm:col-span-2 md:col-span-1">
            <Phone className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-0.5">Telepon & Bantuan</p>
              <p>+62 21 809 1111 (Ext. 245)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
