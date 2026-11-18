import React from 'react';
import { Compass, Heart, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const MuscabThemeSection: React.FC = () => {
  const pillars = [
    {
      title: 'One Vision',
      subtitle: 'Satu Visi & Arah Perjuangan Bersama',
      icon: Compass,
      color: 'from-blue-500 to-electric-600',
      badgeBg: 'bg-electric-500/15 text-electric-600 dark:text-electric-400 border-electric-500/30',
      description:
        'Menyatukan cara pandang dan haluan langkah seluruh insan pekerja SEKARPURA Halim Perdanakusuma menuju cita-cita organisasi yang mandiri, adaptif, dan berorientasi pada masa depan.',
      points: [
        'Arah gerak serikat yang selaras menghadapi transformasi industri kebandarudaraan.',
        'Kepastian perlindungan hak normatif, peningkatan kompetensi, dan transparansi karier.',
        'Menjadikan serikat sebagai motor penggerak profesionalisme pekerja berintegritas.',
      ],
    },
    {
      title: 'One Heart',
      subtitle: 'Satu Hati, Jiwa, & Rasa Memiliki',
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      badgeBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      description:
        'Menumbuhkan empati, ketulusan persaudaraan, dan keterikatan emosional antar seluruh anggota tanpa memandang divisi, unit kerja, maupun masa bakti jabatan.',
      points: [
        'Rasa saling memiliki (sense of belonging) yang merekatkan seluruh keluarga besar pekerja.',
        'Kepedulian sosial dan keterbukaan dalam merangkul serta mendengar setiap aspirasi anggota.',
        'Saling menguatkan saat rekan kerja membutuhkan bantuan advokasi, moral, maupun sosial.',
      ],
    },
    {
      title: 'Strengthening Solidarity',
      subtitle: 'Memperkokoh Solidaritas Insan Pekerja',
      icon: ShieldCheck,
      color: 'from-amber-500 to-gold-500',
      badgeBg: 'bg-gold-500/15 text-gold-600 dark:text-gold-400 border-gold-500/30',
      description:
        'Membangun persatuan yang kokoh, tangguh, dan bermartabat sebagai modal utama perjuangan serikat pekerja dalam mewujudkan keadilan dan kesejahteraan hakiki.',
      points: [
        'Meningkatkan daya tawar dan wibawa organisasi serikat pekerja di tingkat cabang.',
        'Mitra dialog sosial yang kritis, objektif, dan solutif bersama jajaran manajemen.',
        'Memastikan tidak ada satu pun pekerja yang tertinggal dalam perjuangan kesejahteraan.',
      ],
    },
  ];

  return (
    <section className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-3xl p-5 xs:p-7 sm:p-10 shadow-sm space-y-6 sm:space-y-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 rounded-full bg-electric-500/5 blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-600 dark:text-gold-400 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TEMA RESMI MUSCAB IX SEKARPURA HALIM</span>
        </div>

        <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black text-navy-900 dark:text-white tracking-tight leading-tight">
          "One Vision, One Heart : Strengthening Employee Solidarity"
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Filosofi perjuangan Musyawarah Cabang IX dalam menyatukan tekad, merajut ketulusan hati, dan memperkokoh solidaritas seluruh insan pekerja Bandara Halim Perdanakusuma demi kemajuan organisasi yang adil dan berwibawa.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative z-10">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl p-5 sm:p-6 bg-slate-50/70 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700/60 hover:border-gold-500/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pillar.color} text-white flex items-center justify-center shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${pillar.badgeBg}`}
                  >
                    Pilar 0{idx + 1}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-navy-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-semibold text-gold-600 dark:text-gold-400 mt-0.5">
                    {pillar.subtitle}
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Point Bullet List */}
              <div className="pt-3 border-t border-slate-200 dark:border-navy-700/80 space-y-2">
                {pillar.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Solidarity Quote Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-gold-500/30 text-white text-center relative z-10 shadow-md">
        <p className="text-xs sm:text-sm font-bold text-gold-300 tracking-wide">
          "Satu Visi Menuntun Langkah, Satu Hati Menguatkan Jiwa, Solidaritas Pekerja Menentukan Kejayaan Bersama."
        </p>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
          Musyawarah Cabang IX Serikat Pekerja Angkasa Pura Indonesia • Cabang Bandara Halim Perdanakusuma
        </p>
      </div>
    </section>
  );
};
