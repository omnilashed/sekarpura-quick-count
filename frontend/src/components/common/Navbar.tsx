import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  Radio,
  Vote,
  Users,
  Presentation,
  Info,
  LogIn,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Home,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useQuickcountStore } from '../../stores/quickcountStore';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, isAdmin, isCandidate, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isLive } = useQuickcountStore();

  const navLinks = [
    { name: 'Beranda', path: '/', icon: Home },
    { name: 'Bakal Calon', path: '/bakal-calon', icon: Users },
    { name: 'Calon Ketua', path: '/calon-ketua', icon: Award },
    { name: 'Presentasi', path: '/presentasi', icon: Presentation },
    { name: 'QuickCount', path: '/quickcount', icon: Vote },
    { name: 'Info', path: '/informasi', icon: Info },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-navy-900 via-navy-800 to-electric-600 shadow-md p-1 border border-gold-500/30">
                <img src="/logo.svg" alt="SEKARPURA Logo" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-xl tracking-tight text-navy-900 dark:text-white group-hover:text-electric-500 transition-colors truncate">
                    SEKARPURA
                  </span>
                  <span className="bg-gold-500/20 text-gold-600 dark:text-gold-400 font-bold text-[9px] sm:text-[10px] tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full uppercase border border-gold-500/30 shrink-0">
                    HALIM
                  </span>
                </div>
                <p className="text-[9px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[170px] sm:max-w-none">
                  ELECTION CENTER & QUICKCOUNT
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions: Live Indicator, Theme Toggle, Auth CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Indicator Pill */}
              {isLive && (
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-black animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="hidden 2xs:inline">LIVE REKAP</span>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* Auth Buttons for Desktop/Tablet */}
              <div className="hidden sm:flex items-center gap-2">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to={isAdmin ? '/admin' : '/candidate'}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-700 hover:to-navy-800 dark:from-electric-600 dark:to-electric-500 border border-slate-700/50 shadow-sm transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold-400 shrink-0" />
                      <span className="hidden md:inline">{isAdmin ? 'Dashboard Admin' : 'Portal Kandidat'}</span>
                      <span className="md:hidden">Portal</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-600 shadow-md shadow-electric-500/20 transition-all shrink-0"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk</span>
                  </Link>
                )}
              </div>

              {/* Mobile menu hamburger toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
                aria-label="Buka Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Fullscreen / Slide Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-navy-800 bg-white/98 dark:bg-navy-950/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-electric-500' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            <div className="pt-3 border-t border-slate-200 dark:border-navy-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isAdmin ? '/admin' : '/candidate'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-center font-bold text-sm text-white bg-electric-600 shadow-md"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gold-400" />
                    <span>{isAdmin ? 'Dashboard Admin' : 'Portal Kandidat'}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-center font-bold text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar Akun</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-center font-bold text-sm text-white bg-electric-600 shadow-md shadow-electric-500/25"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk Portal Pengguna</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Floating Bottom Navigation Bar for Smartphone Users (Android, iPhone, Flip, Fold) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-navy-800 px-2 py-2 safe-bottom shadow-lg">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto text-center">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              location.pathname === '/'
                ? 'text-electric-600 dark:text-electric-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </Link>

          <Link
            to="/bakal-calon"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              location.pathname === '/bakal-calon'
                ? 'text-electric-600 dark:text-electric-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Kandidat</span>
          </Link>

          {/* QuickCount Center Highlight Tab */}
          <Link
            to="/quickcount"
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${
              location.pathname === '/quickcount'
                ? 'bg-gradient-to-tr from-gold-500 to-amber-400 text-navy-950 scale-105 shadow-glow-gold'
                : 'bg-gradient-to-tr from-electric-600 to-electric-500 text-white'
            }`}>
              <Vote className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-navy-900 dark:text-white mt-1">
              Live QC
            </span>
          </Link>

          <Link
            to="/presentasi"
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              location.pathname === '/presentasi'
                ? 'text-electric-600 dark:text-electric-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Presentation className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Materi</span>
          </Link>

          <Link
            to={isAuthenticated ? (isAdmin ? '/admin' : '/candidate') : '/login'}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
              location.pathname.startsWith('/admin') || location.pathname.startsWith('/candidate') || location.pathname === '/login'
                ? 'text-electric-600 dark:text-electric-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{isAuthenticated ? 'Portal' : 'Masuk'}</span>
          </Link>
        </div>
      </div>
    </>
  );
};
