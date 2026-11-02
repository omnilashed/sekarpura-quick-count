import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useQuickcountStore } from './stores/quickcountStore';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { CandidateLayout } from './components/layout/CandidateLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { BakalCalonPage } from './pages/public/BakalCalonPage';
import { CalonKetuaPage } from './pages/public/CalonKetuaPage';
import { CandidateDetailPage } from './pages/public/CandidateDetailPage';
import { PresentationLibraryPage } from './pages/public/PresentationLibraryPage';
import { LiveQuickCountPage } from './pages/public/LiveQuickCountPage';
import { ElectionInfoPage } from './pages/public/ElectionInfoPage';
import { LoginPage } from './pages/public/LoginPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Candidate Portal Pages
import { CandidateDashboardPage } from './pages/candidate/CandidateDashboardPage';
import { CandidateProfilePage } from './pages/candidate/CandidateProfilePage';
import { CandidateVisionMissionPage } from './pages/candidate/CandidateVisionMissionPage';
import { CandidateProgramsPage } from './pages/candidate/CandidateProgramsPage';
import { CandidatePresentationPage } from './pages/candidate/CandidatePresentationPage';
import { CandidateStatusPage } from './pages/candidate/CandidateStatusPage';
import { AccountSettingsPage } from './pages/candidate/AccountSettingsPage';

// Admin Control Center Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminCandidatesPage } from './pages/admin/AdminCandidatesPage';
import { AdminElectionStagesPage } from './pages/admin/AdminElectionStagesPage';
import { AdminQuickCountPage } from './pages/admin/AdminQuickCountPage';
import { AdminVoteSourcesPage } from './pages/admin/AdminVoteSourcesPage';
import { AdminPresentationsPage } from './pages/admin/AdminPresentationsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export function App() {
  const { checkAuth } = useAuthStore();
  const { initSocket, leaderChangeAlert, clearLeaderAlert } = useQuickcountStore();

  useEffect(() => {
    checkAuth();
    initSocket();
  }, []);

  return (
    <BrowserRouter>
      {/* Real-time Celebratory Notification Pill if Leader Changes */}
      {leaderChangeAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-gold-500 to-amber-400 text-navy-950 p-4 rounded-3xl shadow-2xl flex items-center gap-3 border border-white/50 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center font-bold text-xs shrink-0">
            ★ #1
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider">
              Perubahan Pemimpin Suara!
            </p>
            <p className="font-extrabold text-xs">
              {leaderChangeAlert.leaderName} (No. {leaderChangeAlert.candidateNumber}) memimpin sementara
            </p>
          </div>
          <button
            onClick={clearLeaderAlert}
            className="text-xs font-bold text-navy-950/70 hover:text-navy-950 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <Routes>
        {/* Public Website Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bakal-calon" element={<BakalCalonPage />} />
          <Route path="/calon-ketua" element={<CalonKetuaPage />} />
          <Route path="/kandidat/:id" element={<CandidateDetailPage />} />
          <Route path="/presentasi" element={<PresentationLibraryPage />} />
          <Route path="/quickcount" element={<LiveQuickCountPage />} />
          <Route path="/informasi" element={<ElectionInfoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
        </Route>

        {/* Protected Candidate Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['CANDIDATE', 'ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route index element={<CandidateDashboardPage />} />
            <Route path="profile" element={<CandidateProfilePage />} />
            <Route path="vision-mission" element={<CandidateVisionMissionPage />} />
            <Route path="programs" element={<CandidateProgramsPage />} />
            <Route path="presentation" element={<CandidatePresentationPage />} />
            <Route path="status" element={<CandidateStatusPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>
        </Route>

        {/* Protected Admin Control Center Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="candidates" element={<AdminCandidatesPage />} />
            <Route path="stages" element={<AdminElectionStagesPage />} />
            <Route path="quickcount" element={<AdminQuickCountPage />} />
            <Route path="sources" element={<AdminVoteSourcesPage />} />
            <Route path="presentations" element={<AdminPresentationsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="audit" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
