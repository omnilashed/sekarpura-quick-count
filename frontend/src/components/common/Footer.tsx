import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, Mail, Phone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy-800 p-1 flex items-center justify-center border border-gold-500/30">
                <img src="/logo.svg" alt="SEKARPURA Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base tracking-tight">
                  SEKARPURA ELECTION CENTER
                </h4>
                <p className="text-xs text-gold-400 font-semibold">Cabang Halim Perdanakusuma</p>
              </div>
            </div>
            <p className="text-xs text-gold-400 font-medium">
              Tema Muscab IX: <span className="italic font-bold">"One Vision, One Heart : Strengthening Employee Solidarity"</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform resmi pemantauan dan rekapitulasi real-time pemilihan Ketua Dewan Pengurus Cabang Serikat Pekerja Angkasa Pura Indonesia (SEKARPURA) Bandara Halim Perdanakusuma Masa Bakti 2026-2029.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-gold-500 pl-2">
              Menu Navigasi
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-gold-400 transition-colors">
                  Beranda QuickCount
                </Link>
              </li>
              <li>
                <Link to="/bakal-calon" className="hover:text-gold-400 transition-colors">
                  Daftar Bakal Calon
                </Link>
              </li>
              <li>
                <Link to="/calon-ketua" className="hover:text-gold-400 transition-colors">
                  Calon Ketua Definitif
                </Link>
              </li>
              <li>
                <Link to="/presentasi" className="hover:text-gold-400 transition-colors">
                  Materi Presentasi & Gagasan
                </Link>
              </li>
              <li>
                <Link to="/quickcount" className="hover:text-gold-400 transition-colors">
                  Dashboard Analitik Suara
                </Link>
              </li>
              <li>
                <Link to="/informasi" className="hover:text-gold-400 transition-colors">
                  Tahapan & Tata Tertib Pemilihan
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Integrity & Rules */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-gold-500 pl-2">
              Integritas & Penjaminan
            </h5>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Hasil QuickCount merupakan rekapitulasi berbasis formulir Berita Acara resmi dari seluruh TPS terdaftar.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-900 border border-navy-800 text-[11px] leading-relaxed text-amber-300">
                Data suara live merupakan hasil sementara sampai seluruh proses audit dan penetapan resmi Panitia Pemilihan selesai dikunci.
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Secretariat */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-gold-500 pl-2">
              Sekretariat Panitia
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>Gedung Administrasi Lantai 2, Bandara Internasional Halim Perdanakusuma, Jakarta Timur, 13610</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                <span>panitia@sekarpura-halim.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                <span>+62 21 809 1111 (Ext. 245)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 Panitia Pemilihan SEKARPURA Cabang Halim Perdanakusuma. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Dikelola dengan integritas dan transparansi penuh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
