export interface SeedCandidateData {
  candidateNumber: number;
  fullName: string;
  nickname: string;
  email: string;
  position: string;
  workUnit: string;
  department: string;
  tenure: string;
  biography: string;
  vision: string;
  mission: string[];
  programs: Array<{ title: string; description: string; priority: number }>;
  expectations: string;
  campaignMessage: string;
  experience: Array<{ role: string; organization: string; period: string; description: string }>;
  leadershipExperience: string;
}

export const SEED_CANDIDATES: SeedCandidateData[] = [
  {
    candidateNumber: 1,
    fullName: 'Capt. Hendra Wijaya, S.T.',
    nickname: 'Cak Hendra',
    email: 'kandidat1@sekarpura-halim.org',
    position: 'Senior Air Traffic & Flight Operations Officer',
    workUnit: 'Airport Operation & Airside Management',
    department: 'Airside Operation Services',
    tenure: '15 Tahun',
    biography: 'Berpengalaman lebih dari 15 tahun dalam operasional penerbangan dan keselamatan sisi udara Bandara Halim Perdanakusuma. Aktif memperjuangkan keselamatan kerja dan jam kerja proporsional personil operasional.',
    vision: 'Mewujudkan SEKARPURA Halim yang Progresif, Berdaulat, dan Menjadi Garda Terdepan Kesejahteraan Pekerja Bandara.',
    mission: [
      'Memperjuangkan perbaikan Perjanjian Kerja Bersama (PKB) yang berpihak penuh pada pekerja',
      'Meningkatkan transparansi dan akuntabilitas pengelolaan dana serikat pekerja',
      'Membangun sistem advokasi hukum ketenagakerjaan yang tanggap 24/7 bagi seluruh anggota',
      'Memperkuat solidaritas lintas unit kerja tanpa diskriminasi'
    ],
    programs: [
      {
        title: 'Penguatan Klausul Kesejahteraan PKB 2026',
        description: 'Negosiasi penyesuaian tunjangan operasional shift, asuransi kesehatan keluarga pekerja, dan jaminan purna tugas yang adil.',
        priority: 1
      },
      {
        title: 'Posko Bantuan Hukum Ketenagakerjaan 24 Jam',
        description: 'Menyediakan bantuan advokasi hukum gratis dan pendampingan serikat bagi pekerja yang menghadapi masalah hubungan industrial.',
        priority: 2
      },
      {
        title: 'Koperasi Karyawan & Dana Darurat Solidaritas',
        description: 'Revitalisasi unit simpan pinjam serikat tanpa bunga tinggi dan santunan duka cita mandiri bagi anggota keluarga.',
        priority: 3
      }
    ],
    expectations: 'SEKARPURA Halim harus kembali menjadi rumah perjuangan yang hangat dan berani, disegani oleh manajemen karena integritas serta kualitas anggotanya.',
    campaignMessage: 'Solidaritas bukan sekadar kata, melainkan tindakan nyata memperjuangkan hak setiap insan bandara!',
    experience: [
      {
        role: 'Sekretaris Bidang Ketenagakerjaan',
        organization: 'SEKARPURA Cabang Halim',
        period: '2020 - 2023',
        description: 'Memimpin tim perunding PKB perwakilan cabang'
      },
      {
        role: 'Ketua Tim Keselamatan Airside',
        organization: 'Komite K3 Bandara Halim',
        period: '2018 - 2021',
        description: 'Menyusun protokol keselamatan operasional apron'
      }
    ],
    leadershipExperience: '10 tahun aktif di serikat pekerja dan memimpin berbagai inisiatif perbaikan kesejahteraan personil shift operasional.'
  },
  {
    candidateNumber: 2,
    fullName: 'Budi Santoso, S.Sos.',
    nickname: 'Mas Budi',
    email: 'kandidat2@sekarpura-halim.org',
    position: 'Airport Security Specialist & Senior AVSEC',
    workUnit: 'Aviation Security & Safety Unit',
    department: 'Airport Security Division',
    tenure: '13 Tahun',
    biography: 'Berdedikasi 13 tahun menjaga keamanan penerbangan di Bandara Internasional Halim Perdanakusuma. Dikenal konsisten membela hak-hak petugas keamanan bandara garis depan.',
    vision: 'Membangun Solidaritas Tanpa Sekat Menuju Perlindungan Hak Maksimal bagi Seluruh Insan SEKARPURA Halim.',
    mission: [
      'Menyetarakan standar kesejahteraan antara personil garda depan dan staf administratif',
      'Menjamin perlindungan hukum dalam pelaksanaan tugas operasional keamanan bandara',
      'Menyediakan pelatihan kepemimpinan dan sertifikasi karir bagi anggota muda serikat'
    ],
    programs: [
      {
        title: 'Standardisasi Tunjangan Risiko Personil Keamanan',
        description: 'Memperjuangkan tunjangan risiko kerja tinggi dan perlengkapan pelindung kerja mutakhir sesuai regulasi internasional.',
        priority: 1
      },
      {
        title: 'Aplikasi Aspirasi Anggota Berbasis Digital',
        description: 'Platform digital mobile untuk menyampaikan keluhan dan usulan langsung kepada dewan pengurus secara anonim dan aman.',
        priority: 2
      }
    ],
    expectations: 'Serikat pekerja yang responsif, tidak birokratis, dan hadir di saat anggota membutuhkan bantuan paling mendesak.',
    campaignMessage: 'Keamanan bandara dimulai dari kenyamanan dan kepastian masa depan pekerjanya!',
    experience: [
      {
        role: 'Koordinator Lapangan AVSEC',
        organization: 'SEKARPURA Halim',
        period: '2019 - 2024',
        description: 'Menjembatani komunikasi anggota regu keamanan dengan pengurus pusat'
      }
    ],
    leadershipExperience: 'Memimpin serikat unit keamanan selama 5 tahun dengan rekam jejak penyelesaian sengketa yang adil.'
  },
  {
    candidateNumber: 3,
    fullName: 'Rahmat Hidayat, M.M.',
    nickname: 'Bang Rahmat',
    email: 'kandidat3@sekarpura-halim.org',
    position: 'Manager Terminal Operations & Passenger Services',
    workUnit: 'Terminal Operations Services',
    department: 'Airport Service & Hospitality',
    tenure: '16 Tahun',
    biography: 'Pakar manajemen operasi terminal dengan rekam jejak panjang dalam memperjuangkan keseimbangan kerja dan kehidupan (work-life balance) pekerja bandara berjadwal tinggi.',
    vision: 'SEKARPURA Mandiri, Harmonis, Modern, dan Solutif Menghadapi Transformasi Industri Kebandarudaraan.',
    mission: [
      'Mengedepankan perundingan bipartit yang bermartabat dengan data yang kuat',
      'Meningkatkan kesejahteraan berbasis kinerja dan masa pengabdian yang adil',
      'Mendorong transparansi kebijakan promosi dan jenjang karir pekerja'
    ],
    programs: [
      {
        title: 'Transparansi Penilaian Kinerja & Jenjang Karir',
        description: 'Pengawasan serikat terhadap sistem penilaian kinerja (KPI) agar objektif, terukur, dan bebas dari favoritisme.',
        priority: 1
      },
      {
        title: 'Klinik Kesehatan Jiwa & Konseling Beban Kerja',
        description: 'Program dukungan psikologis gratis bagi staf operasional dengan tingkat stres kerja tinggi.',
        priority: 2
      }
    ],
    expectations: 'Hubungan industrial yang setara dan saling menghormati antara korporasi dan pekerja demi kejayaan Halim Perdanakusuma.',
    campaignMessage: 'Harmoni lahir dari keadilan, solidaritas tumbuh dari keterbukaan.',
    experience: [
      {
        role: 'Ketua Tim Advokasi',
        organization: 'SEKARPURA Halim',
        period: '2021 - 2024',
        description: 'Menyelesaikan sengketa shift kerja terminal saat pemugaran bandara'
      }
    ],
    leadershipExperience: 'Pengurus harian serikat dan ketua divisi pelayanan publik selama lebih dari 8 tahun.'
  },
  {
    candidateNumber: 4,
    fullName: 'Dian Purnama Sari, S.E.',
    nickname: 'Mbak Dian',
    email: 'kandidat4@sekarpura-halim.org',
    position: 'Finance & Airport Commercial Services Specialist',
    workUnit: 'Finance & Commercial Division',
    department: 'Airport Commercial & Revenue',
    tenure: '11 Tahun',
    biography: 'Profesional keuangan bandara yang gigih menyuarakan kesetaraan gender, perlindungan pekerja perempuan bandara, dan transparansi neraca keuangan serikat.',
    vision: 'Mewujudkan Serikat Pekerja yang Transparan, Akuntabel, dan Inklusif bagi Seluruh Generasi Pekerja.',
    mission: [
      'Audit keuangan serikat secara terbuka setiap triwulan kepada seluruh anggota',
      'Penyediaan fasilitas laktasi dan penitipan anak bagi pekerja bandara shift malam',
      'Optimalisasi investasi dana serikat untuk manfaat langsung anggota'
    ],
    programs: [
      {
        title: 'Portal Keuangan Serikat Terbuka',
        description: 'Laporan penerimaan iuran dan penggunaan dana kas serikat dapat diakses secara live oleh seluruh anggota.',
        priority: 1
      },
      {
        title: 'Program Perlindungan Pekerja Perempuan & Keluarga',
        description: 'Pemberian cuti melahirkan yang memadai, jam kerja fleksibel saat menyusui, dan tunjangan anak.',
        priority: 2
      }
    ],
    expectations: 'SEKARPURA yang modern, ramah keluarga, dan memiliki tata kelola keuangan paling bersih di industri aviasi.',
    campaignMessage: 'Integritas finansial serikat adalah fondasi kokoh perjuangan hak kita bersama!',
    experience: [
      {
        role: 'Bendahara Cabang',
        organization: 'SEKARPURA Halim',
        period: '2022 - 2025',
        description: 'Menata tata kelola kas serikat hingga memperoleh opini wajar tanpa pengecualian internal'
      }
    ],
    leadershipExperience: 'Bendahara serikat cabang dan perintis forum pekerja perempuan bandara.'
  },
  {
    candidateNumber: 5,
    fullName: 'Ir. Faisal Basri, M.T.',
    nickname: 'Pak Faisal',
    email: 'kandidat5@sekarpura-halim.org',
    position: 'Airport Facilities & Electrical Maintenance Lead',
    workUnit: 'Airport Facilities & Engineering',
    department: 'Electrical & Mechanical Engineering',
    tenure: '17 Tahun',
    biography: 'Insinyur senior yang telah mengabdi 17 tahun menjaga keandalan kelistrikan dan navigasi Bandara Halim. Dihormati karena keteguhan moral dan pembelaan pada teknisi lapangan.',
    vision: 'Kedaulatan Pekerja Teknik & Operasional Bandara yang Sejahtera dan Terlindungi Keselamatannya.',
    mission: [
      'Peningkatan standar K3 teknis dan asuransi kecelakaan kerja dengan nilai santunan terbaik',
      'Mendorong sertifikasi profesi personil teknik yang dibiayai oleh korporasi',
      'Memperjuangkan uang lembur tepat waktu dan penyesuaian upah teknis spesialis'
    ],
    programs: [
      {
        title: 'Jaminan Keselamatan Kerja Tanpa Kompromi',
        description: 'Inspeksi berkala serikat terhadap alat pelindung diri dan penolakan tugas berbahaya tanpa SOP yang aman.',
        priority: 1
      },
      {
        title: 'Beasiswa Pendidikan Anak Pekerja Bandara',
        description: 'Alokasi khusus dari kas serikat untuk biaya pendidikan putra-putri anggota berprestasi.',
        priority: 2
      }
    ],
    expectations: 'Pekerja teknik diakui keahliannya dan mendapatkan penghormatan layak atas keringat menjaga bandara tetap menyala.',
    campaignMessage: 'Keringat teknisi menjaga bandara tetap terbang, serikat menjaga masa depan keluarganya!',
    experience: [
      {
        role: 'Wakil Ketua Bidang K3 & Ketenagakerjaan',
        organization: 'SEKARPURA Cabang',
        period: '2019 - 2023',
        description: 'Memperjuangkan perbaikan alat keselamatan teknisi Runway & Apron'
      }
    ],
    leadershipExperience: '17 tahun memimpin unit teknis dan 8 tahun memegang amanah di serikat pekerja.'
  },
  {
    candidateNumber: 6,
    fullName: 'Agus Triyono, S.T.',
    nickname: 'Cak Agus',
    email: 'kandidat6@sekarpura-halim.org',
    position: 'Safety Management System & Quality Assurance Inspector',
    workUnit: 'Safety, Quality & Compliance',
    department: 'Aviation Safety Division',
    tenure: '12 Tahun',
    biography: 'Auditor keselamatan penerbangan yang berkomitmen menegakkan prinsip transparansi dan keadilan bagi seluruh strata pekerja.',
    vision: 'Serikat Pekerja yang Cerdas, Solutif, dan Berintegritas Tinggi.',
    mission: ['Membangun budaya just culture di lingkungan kerja', 'Advokasi tanpa pandang bulu'],
    programs: [{ title: 'Just Culture Protection Program', description: 'Perlindungan bagi personil yang melaporkan insiden tanpa takut dikriminalisasi manajemen.', priority: 1 }],
    expectations: 'Serikat yang objektif dan berbobot.',
    campaignMessage: 'Keselamatan sejati berakar dari keadilan bagi pekerjanya.',
    experience: [{ role: 'Ketua Tim Regulasi', organization: 'SEKARPURA', period: '2021-2024', description: 'Kajian hukum regulasi KM' }],
    leadershipExperience: 'Memimpin investigasi keselamatan dan komite etika serikat.'
  },
  {
    candidateNumber: 7,
    fullName: 'Eko Prasetyo, S.H.',
    nickname: 'Mas Eko',
    email: 'kandidat7@sekarpura-halim.org',
    position: 'Aviation Legal & Industrial Relations Specialist',
    workUnit: 'Legal & Industrial Relations',
    department: 'Corporate Secretary & Legal',
    tenure: '10 Tahun',
    biography: 'Praktisi hukum ketenagakerjaan yang berpengalaman dalam perundingan tripartit dan peradilan hubungan industrial.',
    vision: 'Kekuatan Hukum yang Kuat untuk Perisai Perlindungan Hak Anggota.',
    mission: ['Revitalisasi klausul PKB', 'Pendidikan sadar hukum bagi seluruh anggota serikat'],
    programs: [{ title: 'Akademi Hukum Ketenagakerjaan Mandiri', description: 'Pendidikan hukum gratis bagi seluruh pengurus unit.', priority: 1 }],
    expectations: 'Serikat yang tidak gentar menghadapi tekanan hukum apapun.',
    campaignMessage: 'Hak pekerja adalah hak konstitusi yang wajib dibela sampai tuntas!',
    experience: [{ role: 'Ketua Divisi Hukum', organization: 'SEKARPURA', period: '2020-2025', description: 'Pendampingan 45+ kasus hubungan industrial' }],
    leadershipExperience: 'Memimpin advokasi litigasi serikat di PHI DKI Jakarta.'
  },
  {
    candidateNumber: 8,
    fullName: 'Maya Indah Lestari, S.Psi.',
    nickname: 'Mbak Maya',
    email: 'kandidat8@sekarpura-halim.org',
    position: 'Human Capital & Employee Wellbeing Lead',
    workUnit: 'Human Capital Division',
    department: 'People & Culture',
    tenure: '9 Tahun',
    biography: 'Pemerhati kesejahteraan emosional dan hubungan interpersonal antar pekerja bandara.',
    vision: 'Serikat yang Humanis, Peduli, dan Mengayomi Kesejahteraan Fisik dan Mental Pekerja.',
    mission: ['Mengurangi burnout di kalangan pekerja shift', 'Menguatkan komunikasi antar generasi pekerja'],
    programs: [{ title: 'Wellness & Mental Health Support', description: 'Layanan konseling privat dan workshop manajemen stres kerja.', priority: 1 }],
    expectations: 'SEKARPURA sebagai keluarga besar yang saling menjaga.',
    campaignMessage: 'Kesehatan mental dan kebahagiaan kerja adalah hak asasi kita!',
    experience: [{ role: 'Koordinator Kesejahteraan', organization: 'SEKARPURA', period: '2022-2025', description: 'Pelopor program konseling serikat' }],
    leadershipExperience: 'Inisiator program peer-support bandara.'
  },
  {
    candidateNumber: 9,
    fullName: 'Arif Rahman, S.Kom.',
    nickname: 'Mas Arif',
    email: 'kandidat9@sekarpura-halim.org',
    position: 'Airport Technology & Digital Systems Specialist',
    workUnit: 'Information Technology Division',
    department: 'Airport Smart Technology',
    tenure: '8 Tahun',
    biography: 'Pegiat digitalisasi serikat yang ingin membawa SEKARPURA Halim menjadi serikat pekerja bandara paling modern di Indonesia.',
    vision: 'Modernisasi Serikat Menuju SEKARPURA 4.0 yang Transparan, Cepat, dan Akurat.',
    mission: ['Digitalisasi seluruh sistem administrasi serikat', 'Kanal voting aspirasi real-time'],
    programs: [{ title: 'SEKARPURA Mobile One-Stop App', description: 'Pendaftaran anggota, aduan aspirasi, dan cek saldo kas serikat dalam satu aplikasi.', priority: 1 }],
    expectations: 'Kemudahan akses serikat hanya lewat ujung jari setiap anggota.',
    campaignMessage: 'Teknologi untuk transparansi, digitalisasi untuk solidaritas!',
    experience: [{ role: 'Kepala Divisi IT', organization: 'SEKARPURA', period: '2023-2025', description: 'Pengembang portal digital serikat' }],
    leadershipExperience: 'Arsitek transformasi digital sistem serikat pekerja.'
  },
  {
    candidateNumber: 10,
    fullName: 'Doni Setiawan, S.E.',
    nickname: 'Bang Doni',
    email: 'kandidat10@sekarpura-halim.org',
    position: 'Apron Movement Control & Ramp Safety Lead',
    workUnit: 'Airside Operation & Ramp Safety',
    department: 'Apron Management Services',
    tenure: '14 Tahun',
    biography: 'Tokoh lapangan yang disegani oleh personil ramp dan ground handling. Tegas, bersahaja, dan setia kawan.',
    vision: 'Solidaritas Tanpa Kompromi untuk Kesejahteraan Pekerja Lapangan.',
    mission: ['Memastikan uang shift dan makan malam tepat waktu', 'Perlindungan cuaca ekstrem di apron'],
    programs: [{ title: 'Shelter Nyaman & Perlindungan Cuaca Ekstrem', description: 'Pengadaan shelter istirahat ber-AC di apron dan jaminan seragam tahan air.', priority: 1 }],
    expectations: 'Pekerja lapangan mendapatkan fasilitas istirahat yang manusiawi dan bermartabat.',
    campaignMessage: 'Pekerja apron adalah tulang punggung bandara, haknya tidak boleh diabaikan!',
    experience: [{ role: 'Koordinator Lapangan Sisi Udara', organization: 'SEKARPURA', period: '2018-2024', description: 'Koordinator aspirasi 300+ personil airside' }],
    leadershipExperience: '14 tahun di garis depan dan koordinator aksi damai serikat.'
  }
];

export const SEED_VOTE_SOURCES = [
  { sourceCode: 'TPS-01', sourceName: 'TPS 1 - Gedung Administrasi & Kantor Cabang', workUnit: 'Corporate & Finance', location: 'Lantai 2 Gedung Administrasi Halim', targetVoters: 110 },
  { sourceCode: 'TPS-02', sourceName: 'TPS 2 - Terminal Keberangkatan & Layanan Penumpang', workUnit: 'Terminal Services', location: 'Ruang Briefing Terminal Keberangkatan', targetVoters: 95 },
  { sourceCode: 'TPS-03', sourceName: 'TPS 3 - Posko Aviation Security (AVSEC)', workUnit: 'Security & Safety', location: 'Gedung Operasional AVSEC Halim', targetVoters: 120 },
  { sourceCode: 'TPS-04', sourceName: 'TPS 4 - Airport Rescue & Fire Fighting (ARFF)', workUnit: 'Emergency & Fire', location: 'Station ARFF Sisi Udara', targetVoters: 85 },
  { sourceCode: 'TPS-05', sourceName: 'TPS 5 - Apron Movement Control & Ramp Area', workUnit: 'Airside Operations', location: 'Tower AMC Lantai 1', targetVoters: 90 },
  { sourceCode: 'TPS-06', sourceName: 'TPS 6 - Workshop Fasilitas Mekanikal & Elektrikal', workUnit: 'Engineering', location: 'Gedung Workshop Teknik Halim', targetVoters: 105 },
  { sourceCode: 'TPS-07', sourceName: 'TPS 7 - Navigasi Penerbangan & AOCC', workUnit: 'Air Traffic & AOCC', location: 'Gedung AOCC Ruang Rapat Lt. 1', targetVoters: 75 },
  { sourceCode: 'TPS-08', sourceName: 'TPS 8 - Terminal Kargo & Logistik Bandara', workUnit: 'Cargo & Logistics', location: 'Gedung Domestik Cargo Lt. 2', targetVoters: 80 },
  { sourceCode: 'TPS-09', sourceName: 'TPS 9 - Ground Handling & Layanan Penunjang', workUnit: 'Support Services', location: 'Ruang Serikat Gedung Penunjang', targetVoters: 115 },
  { sourceCode: 'TPS-10', sourceName: 'TPS 10 - Unit Pelayanan Kebersihan & Fasilitas Umum', workUnit: 'Facility Care', location: 'Kantor Pengelola Fasilitas', targetVoters: 70 },
];
