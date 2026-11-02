import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  UserCircle,
  FileText,
  Target,
  Presentation,
  CheckCircle2,
  Lock,
  Vote,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { BASE_URL } from '../../services/api';

export const CandidateLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const candidate = user?.candidate;

  const navigation = [
    { name: 'Ringkasan Dashboard', path: '/candidate', icon: Home },
    { name: 'Biodata & Profil', path: '/candidate/profile', icon: UserCircle },
    { name: 'Visi & Misi', path: '/candidate/vision-mission', icon: Target },
    { name: 'Program Kerja Unggulan', path: '/candidate/programs', icon: FileText },
    { name: 'Materi Presentasi', path: '/candidate/presentation', icon: Presentation },
    { name: 'Status Pencalonan', path: '/candidate/status', icon: CheckCircle2 },
    { name: 'Pengaturan Akun', path: '/candidate/settings', icon: Lock },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Profile completion calculation
  const getCompletionPercentage = () => {
    if (!candidate) return 50;
    let score = 0;
    if (candidate.fullName) score += 15;
    if (candidate.position) score += 15;
    if (candidate.profilePhoto && !candidate.profilePhoto.includes('default')) score += 15;
    if (candidate.vision) score += 15;
    if (candidate.mission && candidate.mission.length > 0) score += 15;
    if (candidate.programs && candidate.programs.length > 0) score += 15;
    if (candidate.presentationId) score += 10;
    return Math.min(score, 100);
  };

  const completion = getCompletionPercentage();

  const photoSrc = candidate?.profilePhoto
    ? candidate.profilePhoto.startsWith('http')
      ? candidate.profilePhoto
      : `${BASE_URL}${candidate.profilePhoto}`
    : '/logo.svg';

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-navy-950 text-slate-300 flex flex-col justify-between border-r border-navy-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Logo */}
          <div className="h-16 sm:h-20 flex items-center justify-between px-5 sm:px-6 border-b border-navy-800 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-navy-800 p-1 flex items-center justify-center border border-gold-500/30 shrink-0">
                <img src="/logo.svg" alt="SEKARPURA Logo" className="w-6 sm:w-7 h-6 sm:h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate block">
                  PORTAL KANDIDAT
                </span>
                <p className="text-[9px] sm:text-[10px] text-gold-400 font-bold uppercase tracking-wider truncate">
                  SEKARPURA HALIM
                </p>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Candidate Profile Widget in Sidebar */}
          <div className="p-3 sm:p-4 border-b border-navy-800/80 bg-navy-900/40 shrink-0">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-gold-500/40 shrink-0 bg-navy-800">
                <img
                  src={photoSrc}
                  alt={user?.name || 'Kandidat'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gold-400 text-navy-950 shrink-0">
                    No. {candidate?.candidateNumber || '-'}
                  </span>
                  <p className="font-extrabold text-xs text-white truncate">{user?.name}</p>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                  {candidate?.position || 'Calon Ketua'}
                </p>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-1">
                <span>Kelengkapan Profil</span>
                <span className="text-gold-400 font-bold">{completion}%</span>
              </div>
              <div className="w-full bg-navy-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-gold-500 to-amber-300 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-3 sm:p-4 space-y-1 overflow-y-auto flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Menu Kandidat
            </p>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
                    isActive
                      ? 'bg-electric-600 text-white shadow-md shadow-electric-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-navy-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0 ml-1" />}
                </Link>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="p-3 sm:p-4 border-t border-navy-800 bg-navy-900/60 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <Link
                to="/quickcount"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-navy-800 hover:bg-navy-700 transition-colors min-h-[38px]"
              >
                <Vote className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                <span className="truncate">QuickCount Live</span>
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-navy-800 min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <header className="h-14 sm:h-16 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xs xs:text-sm sm:text-base font-extrabold text-navy-900 dark:text-white truncate">
              Portal Calon Ketua SEKARPURA Halim
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Akun Aktif
            </span>
          </div>
        </header>

        <main className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
