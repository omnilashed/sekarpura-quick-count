# SEKARPURA ELECTION CENTER

> **"Transparansi Demokrasi, Membangun Solidaritas Pekerja."**  
> *Platform Pengelolaan & Real-Time QuickCount Pemilihan Ketua Dewan Pengurus Cabang Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA) Bandara Halim Perdanakusuma Masa Bakti 2026–2029.*

---

## 1. TENTANG APLIKASI

**SEKARPURA ELECTION CENTER** adalah platform pemilihan digital production-ready, modern, responsif, interaktif, dan aman yang dirancang untuk mewujudkan transparansi penuh dalam proses pemilihan ketua serikat pekerja.

### Fitur Unggulan:
1. **Live QuickCount Command Center**:
   - Pemantauan perolehan suara sah, suara tidak sah, dan progres TPS secara real-time via WebSocket.
   - Peringatan instan apabila terjadi pergantian pemimpin sementara (*Leaderboard celebration*).
2. **Animated Top 5 Candidate Podium**:
   - Tampilan podium tiga dimensi dinamis berbasis Framer Motion dengan aksen khusus:
     - **Peringkat 1:** Gold `#F5C451` (Center elevation & glow highlight)
     - **Peringkat 2:** Silver `#94A3B8`
     - **Peringkat 3:** Bronze `#CD7F32`
     - **Peringkat 4:** Electric Blue `#3B82F6`
     - **Peringkat 5:** Purple `#8B5CF6`
   - Animasi count-up suara dan persentase yang mulus, penataan posisi otomatis (*layout animation*), serta penanganan nilai seri (*deterministic tie-breaker*).
3. **Statistik & Visualisasi Analitik (Recharts)**:
   - Bar Chart distribusi suara per calon.
   - Donut Chart pangsa suara (% vote share).
   - Historical Trends timeline akumulasi suara per TPS.
   - Tabel ranking komprehensif dengan selisih suara dari peringkat 1.
   - Live activity ticker rekapitulasi masuk yang aman (tanpa data rahasia pemilih).
4. **Election Stage Management (Dua Tahap)**:
   - **Tahap 1:** Penjaringan 10 Bakal Calon Ketua.
   - **Tahap 2:** Pemilihan Calon Ketua Definitif (Top 5 lolos tahap 1).
   - Validasi status tahapan: `DRAFT`, `NOMINATION_OPEN`, `PRELIMINARY_COUNTING`, `PRELIMINARY_COMPLETED`, `FINAL_CANDIDATES_ANNOUNCED`, `FINAL_COUNTING`, `FINAL_COMPLETED`, `ARCHIVED`.
   - Sesi QuickCount Tahap 2 terisolasi bersih dan tidak menggabungkan suara tahap 1.
5. **Presentation Management & Modern Viewer**:
   - Unggah materi presentasi kampanye (.ppt, .pptx, .pdf) dengan drag-and-drop.
   - Konversi server-side representasi presentasi ke format web.
   - Penampil slide interaktif: navigasi slide, autoplay berjangka waktu, mode layar penuh (F), zoom, thumbnail sidebar, dan pintasan keyboard.
6. **Admin Control Center**:
   - Pendaftaran & CRUD kandidat + pembuatan akun login otomatis.
   - Input rekapitulasi suara per TPS dengan validasi integritas total suara.
   - **Koreksi Suara Berita Acara**: Setiap revisi suara mewajibkan alasan tertulis dan mencatat riwayat revisi (ledger) tanpa *double counting*.
   - Pencegahan input ganda per TPS (*unique index & server validation*).
   - Ekspor laporan resmi dalam format **PDF, Excel (.xlsx), dan CSV**.
   - Catatan audit kepatuhan (*immutable audit trail*) untuk setiap tindakan sensitif.
7. **Portal Mandiri Bakal Calon**:
   - Dashboard kelengkapan profil (*Profile completion score*).
   - Pengisian biodata, visi, misi, program prioritas, dan harapan terhadap organisasi.
   - Unggah foto profil dan materi presentasi kampanye.
   - Pemantauan status verifikasi berkas dan kualifikasi tahap 2 secara langsung.

---

## 2. ARSITEKTUR TEKNOLOGI

```
React (TypeScript + Vite + Tailwind + Framer Motion)
                     │ (REST API / HttpOnly Cookie & WebSocket)
                     ▼
         Node.js + Express (TypeScript)
                     │ (Mongoose ODM)
                     ▼
               MongoDB Database
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, Zustand, TanStack Query, Axios, Socket.IO Client.
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Mongoose, Socket.IO, JWT, bcryptjs, Zod, Multer, Helmet, CORS, Rate Limiting, PDFKit, ExcelJS, JSZip.
- **Container**: Docker & Docker Compose.

---

## 3. PANDUAN INSTALASI & MENJALANKAN SECARA LOKAL

### Prasyarat:
- **Node.js** v18+ (Disarankan Node.js v20/v22)
- **npm** v9+
- **MongoDB** v6.0+ (Lokal atau MongoDB Atlas)

---

### Langkah 1: Clone & Konfigurasi Lingkungan

Salin file contoh konfigurasi environment:
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
cd ..
```

---

### Langkah 2: Install Dependensi & Jalankan Seed Data

```bash
# 1. Install dependensi Backend
cd backend
npm install

# 2. Inisialisasi Database & Seeding Data Dummy Realistis
npm run seed
```

> **Catatan Seed Data:**
> Skrip seed akan membuat akun Super Admin, 10 Bakal Calon Ketua dengan profil lengkap, 10 TPS, dan memasukkan data suara sementara dari 6 TPS untuk simulasi langsung.

---

### Langkah 3: Jalankan Backend & Frontend

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev
# Server aktif di: http://localhost:5000
# WebSocket aktif di: ws://localhost:5000
```

#### Terminal 2 — Frontend:
```bash
cd frontend
npm run dev
# Website aktif di: http://localhost:5173
```

Buka peramban Anda di **`http://localhost:5173`**.

---

## 4. KREDENSIAL AKUN CONTOH (SIMULASI PENGUJIAN)

Sistem telah dilengkapi dengan akun siap pakai untuk pengujian end-to-end:

### A. Super Administrator
- **Email**: `admin@sekarpura-halim.org`
- **Password**: `AdminSekarpura2026!`
- **Akses**: Admin Dashboard, QuickCount Control Center, Verifikasi Calon, Ekspor Laporan, Audit Logs, Pengaturan Sistem.

### B. Bakal Calon / Calon Ketua
| No. Urut | Nama Kandidat | Email Login | Password | Jabatan |
|---|---|---|---|---|
| **#1** | Capt. Hendra Wijaya, S.T. | `kandidat1@sekarpura-halim.org` | `Kandidat2026!` | Senior Air Traffic & Airside Lead |
| **#2** | Budi Santoso, S.Sos. | `kandidat2@sekarpura-halim.org` | `Kandidat2026!` | Airport Security Specialist |
| **#3** | Rahmat Hidayat, M.M. | `kandidat3@sekarpura-halim.org` | `Kandidat2026!` | Manager Terminal Operations |
| **#4** | Dian Purnama Sari, S.E. | `kandidat4@sekarpura-halim.org` | `Kandidat2026!` | Finance & Commercial Specialist |
| **#5** | Ir. Faisal Basri, M.T. | `kandidat5@sekarpura-halim.org` | `Kandidat2026!` | Facilities & Engineering Lead |
| **#6** | Agus Triyono, S.T. | `kandidat6@sekarpura-halim.org` | `Kandidat2026!` | Safety & Quality Inspector |
| **#7** | Eko Prasetyo, S.H. | `kandidat7@sekarpura-halim.org` | `Kandidat2026!` | Aviation Legal & Industrial Relations |
| **#8** | Maya Indah Lestari, S.Psi. | `kandidat8@sekarpura-halim.org` | `Kandidat2026!` | Human Capital & Wellbeing Lead |
| **#9** | Arif Rahman, S.Kom. | `kandidat9@sekarpura-halim.org` | `Kandidat2026!` | Airport Smart Technology Lead |
| **#10** | Doni Setiawan, S.E. | `kandidat10@sekarpura-halim.org` | `Kandidat2026!` | Apron Movement Control Lead |

*(Halaman Login menyediakan tombol cepat satu klik untuk mengisi akun Super Admin dan Kandidat #1).*

---

## 5. PENGUJIAN OTOMATIS (AUTOMATED TESTING)

Aplikasi dilengkapi dengan rangkaian unit & integration tests berbasis **Vitest** dan **Supertest** untuk memverifikasi autentikasi RBAC, integritas perhitungan suara, proteksi input ganda, dan prosedur audit koreksi:

```bash
cd backend
npm test
```

Hasil uji:
```
 ✓ tests/api.test.ts (10 tests)
 Test Files  1 passed (1)
      Tests  10 passed (10)
```

---

## 6. MENJALANKAN DENGAN DOCKER COMPOSE

Untuk menjalankan seluruh lingkungan (MongoDB + Backend + Frontend Nginx) dalam container:

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- MongoDB: `mongodb://localhost:27017`

---

## 7. STRUKTUR DIREKTORI REPOSITORI

```
sekarpura/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Socket.IO, Env Config
│   │   ├── controllers/     # Auth, Candidate, Election, QuickCount, Report, User, Audit
│   │   ├── middlewares/     # JWT Auth, RBAC, File Upload, Error Handler
│   │   ├── models/          # 9 Mongoose Schemas (User, Candidate, Election, Stages, etc.)
│   │   ├── routes/          # Express Modular REST Routes
│   │   ├── seeds/           # Seed Data & Simulation Generator
│   │   ├── services/        # QuickCount Engine, Presentation, Audit, Report Services
│   │   ├── validations/     # Zod Schemas
│   │   ├── app.ts           # Express Application Setup
│   │   └── server.ts        # Server HTTP & Socket.IO Bootstrap
│   ├── tests/               # Vitest API & Integrity Test Suite
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Navbar, Footer, StatusBadge, CountUp, ProtectedRoute
│   │   │   ├── quickcount/  # PodiumTop5, Charts, LeaderboardTable, LiveFeed
│   │   │   ├── presentation/# PresentationViewer, PresentationCard
│   │   │   ├── candidate/   # CandidateCard, Hero, Filters
│   │   │   └── layout/      # PublicLayout, AdminLayout, CandidateLayout
│   │   ├── pages/
│   │   │   ├── public/      # Home, BakalCalon, CalonKetua, Detail, Presentation, Info, Login
│   │   │   ├── candidate/   # Dashboard, Profile, VisionMission, Programs, Presentation, Settings
│   │   │   └── admin/       # Overview, Candidates, Stages, QuickCount, Sources, Users, Reports, Audit
│   │   ├── stores/          # Zustand Auth, QuickCount Real-Time, Theme
│   │   ├── services/        # Axios API Client & Services
│   │   ├── types/           # TypeScript Definitions
│   │   ├── App.tsx          # React Router & Live Notification
│   │   └── main.tsx
│   ├── Dockerfile
│   └── nginx.conf
├── uploads/                 # Storage Lokal File Presentasi & Foto Profil
├── docker-compose.yml       # Production Docker Stack
└── README.md
```

---

## 8. HAK CIPTA & LISENSI

Aplikasi ini dikembangkan untuk **Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA) Cabang Bandara Halim Perdanakusuma**. Seluruh hak cipta dilindungi undang-undang.
