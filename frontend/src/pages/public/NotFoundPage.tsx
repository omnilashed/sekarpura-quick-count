import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-20 h-20 rounded-3xl bg-electric-500/10 text-electric-500 flex items-center justify-center text-3xl font-black mb-6">
        404
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white mb-2">
        Halaman Tidak Ditemukan
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        Tautan yang Anda tuju mungkin telah berpindah, dinonaktifkan, atau alamat URL yang dimasukkan salah.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-electric-600 hover:bg-electric-500 text-white font-bold text-sm shadow-lg shadow-electric-600/25 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Kembali ke Beranda Utama</span>
      </Link>
    </div>
  );
};
