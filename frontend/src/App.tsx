import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import GoogleSuccess from './pages/GoogleSuccess';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Planner from './pages/Planner';
import Settings from './pages/Settings';
import Notes from './pages/Notes';
import { useThemeStore } from './store/themeStore';
import { useSocketStore } from './store/socketStore';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken, loading } = useAuthStore();
  
  if (loading || (accessToken && !user)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm font-medium">Chargement...</p>
      </div>
    );
  }
  
  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/google-success" element={<GoogleSuccess />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppShell />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="planner" element={<Planner />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notes" element={<Notes />} />
      </Route>
    </Routes>
  );
};

function App() {
  const { setUser, logout, accessToken } = useAuthStore();
  const { theme } = useThemeStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    // Initialize theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!accessToken) {
        useAuthStore.setState({ loading: false });
        return;
      }

      // If token exists but user doesn't, we are loading
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        useAuthStore.setState({ loading: true });
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        connect(accessToken);
      } catch (error) {
        console.error("Token verification failed", error);
        logout();
        disconnect();
      } finally {
        useAuthStore.setState({ loading: false });
      }
    };

    verifyAuth();
    
    return () => {
      // Disconnect when app unmounts or token changes
      if (!accessToken) disconnect();
    };
  }, [accessToken, setUser, logout, connect, disconnect]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
