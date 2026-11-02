import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Vote,
  Layers,
  MapPin,
  Presentation,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  UserCheck,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const navigation = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Manajemen Kandidat', path: '/admin/candidates', icon: Users },
    { name: 'Tahapan & Calon Definitif', path: '/admin/stages', icon: Layers },
    { name: 'QuickCount Control Center', path: '/admin/quickcount', icon: Vote },
    { name: 'Sumber Suara / TPS', path: '/admin/sources', icon: MapPin },
    { name: 'Manajemen Presentasi', path: '/admin/presentations', icon: Presentation },
    { name: 'Manajemen Pengguna', path: '/admin/users', icon: UserCheck },
    { name: 'Laporan & Ekspor', path: '/admin/reports', icon: FileSpreadsheet },
    { name: 'Audit Logs & Kepatuhan', path: '/admin/audit', icon: ShieldAlert },
    { name: 'Pengaturan Sistem', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop */}
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
          {/* Logo Header */}
          <div className="h-16 sm:h-20 flex items-center justify-between px-5 sm:px-6 border-b border-navy-800 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy-800 p-1 flex items-center justify-center border border-gold-500/30 shrink-0">
                <img src="/logo.svg" alt="SEKARPURA Logo" className="w-6 sm:w-7 h-6 sm:h-7 object-contain" />
              </div>
              <div className="min-w-0">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight truncate block">
                  ADMIN CENTER
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

          {/* Nav Items */}
          <div className="p-3 sm:p-4 space-y-1 overflow-y-auto flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Menu Pengelolaan
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

          {/* User Card & Logout Bottom */}
          <div className="p-3 sm:p-4 border-t border-navy-800 bg-navy-900/60 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-gold-400 font-semibold uppercase">{user?.role}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-navy-800"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-navy-800 hover:bg-navy-700 transition-colors min-h-[38px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lihat Publik</span>
              </Link>
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
        {/* Top Navbar */}
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
              Pusat Kendali Pemilihan SEKARPURA
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            <span className="hidden md:inline">Tahun: <strong>2026</strong></span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xs:inline">Sistem Online</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
