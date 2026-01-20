
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
import { ConnectivityStatus } from './components/ConnectivityStatus';
import { StreakSuccessModal } from './components/StreakSuccessModal';
import { LoginStreakWelcome } from './components/LoginStreakWelcome';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = ['/', '/login', '/register', '/forgot-password', '/subjects'].includes(location.pathname);

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 dark:text-gray-100 bg-background-light dark:bg-background-dark">
      <ConnectivityStatus />
      <StreakSuccessModal />
      <LoginStreakWelcome />
      <main className="h-full min-h-screen relative">
        {children}
      </main>
      {!hideNav && <Navigation />}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
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
