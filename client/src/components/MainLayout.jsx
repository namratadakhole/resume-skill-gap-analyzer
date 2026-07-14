import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

// Pages
import Dashboard from '../pages/Dashboard';
import Settings from '../pages/Settings';
import Reports from '../pages/Reports';
import History from '../pages/History';
import Profile from '../pages/Profile';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResumeStudio from '../pages/ResumeStudio';
import InterviewPrep from '../pages/InterviewPrep';
import ProjectRecommendations from '../pages/ProjectRecommendations';

// Lucide icon
import { Loader } from 'lucide-react';

// Context
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, loading } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('Dashboard');

  // Route protection redirect checks
  useEffect(() => {
    if (!user) {
      // If logged out, default non-auth pages back to login screen
      if (activePage !== 'Login' && activePage !== 'Register' && activePage !== 'ForgotPassword') {
        setActivePage('Login');
      }
    } else {
      // If logged in, default auth pages back to Dashboard workspace
      if (activePage === 'Login' || activePage === 'Register' || activePage === 'ForgotPassword') {
        setActivePage('Dashboard');
      }
      // Redirect previous resume sub-pages into Resume Studio
      if (activePage === 'Resume Manager' || activePage === 'Resume Analysis' || activePage === 'AI Resume Rewrite') {
        setActivePage('Resume Studio');
      }
    }
  }, [user, activePage]);

  // Global loading spinner check
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-slate-800 dark:text-slate-200" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing Secure Session...</p>
        </div>
      </div>
    );
  }

  // Logged-out layout container (Stripe / ChatGPT minimal style)
  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
        <main className="flex-grow flex items-center justify-center p-6 max-w-7xl mx-auto w-full">
          {activePage === 'Register' ? (
            <Register onNavigate={setActivePage} />
          ) : activePage === 'ForgotPassword' ? (
            <ForgotPassword onNavigate={setActivePage} />
          ) : (
            <Login onNavigate={setActivePage} />
          )}
        </main>
      </div>
    );
  }

  // Logged-in application layout container
  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        activePage={activePage} 
        setActivePage={setActivePage} 
      />
      
      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activePage === 'Dashboard' && <Dashboard />}
          {activePage === 'Resume Studio' && <ResumeStudio />}
          {activePage === 'Interview Preparation' && <InterviewPrep />}
          {activePage === 'Project Recommendations' && <ProjectRecommendations />}
          {activePage === 'Reports' && <Reports />}
          {activePage === 'History' && <History setActivePage={setActivePage} />}
          {activePage === 'Profile' && <Profile />}
          {activePage === 'Settings' && <Settings />}
          {activePage !== 'Dashboard' && activePage !== 'Resume Studio' && activePage !== 'Interview Preparation' && activePage !== 'Project Recommendations' && activePage !== 'Reports' && activePage !== 'History' && activePage !== 'Profile' && activePage !== 'Settings' && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-soft">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Module under development</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                The {activePage} section is currently configured in mockup mode.
              </p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
