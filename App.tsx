
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Kanban } from './components/Kanban';
import { LoginPage } from './app/(auth)/login/page';
import { RegisterPage } from './app/(auth)/register/page';
import { ForgotPasswordPage } from './app/(auth)/forgot-password/page';
import { Navigation } from './components/Navigation';
import { AITutor } from './components/AITutor';
import { Settings } from './components/Settings';
import { CalendarView } from './components/CalendarView';
import { StudyDocuments } from './components/StudyDocuments';
import { SubjectSelection } from './components/SubjectSelection';
import { useAuthStore } from './lib/store/authStore';
import { useDataStore } from './lib/store/dataStore';
import { ConnectivityStatus } from './components/ConnectivityStatus';
import { StreakSuccessModal } from './components/StreakSuccessModal';
import { LoginStreakWelcome } from './components/LoginStreakWelcome';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = ['/', '/login', '/register', '/forgot-password', '/subjects'].includes(location.pathname);
  const { isSyncing } = useDataStore();

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 dark:text-gray-100 bg-background-light dark:bg-background-dark">
      <ConnectivityStatus />
      <StreakSuccessModal />
      <LoginStreakWelcome />
      
      {isSyncing && (
          <div className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center">
              <div className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-white/20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Đang đồng bộ dữ liệu...</p>
              </div>
          </div>
      )}

      <main className="h-full min-h-screen relative">
        {children}
      </main>
      {!hideNav && <Navigation />}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const TimeTracker: React.FC = () => {
    const { isAuthenticated, trackStudyTime } = useAuthStore();
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') trackStudyTime(1);
        }, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated, trackStudyTime]);
    return null;
};

const App: React.FC = () => {
  const { initSession, isAuthenticated, user } = useAuthStore();
  const { fetchUserData } = useDataStore();

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
      if (isAuthenticated && user) {
          fetchUserData(user.id);
      }
  }, [isAuthenticated, user, fetchUserData]);

  return (
    <HashRouter>
      <TimeTracker />
      <Layout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/subjects" element={<ProtectedRoute><SubjectSelection /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
          <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><StudyDocuments /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
