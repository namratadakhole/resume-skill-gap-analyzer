import React from 'react';
import { 
  LayoutDashboard, 
  FileText,
  FileSearch, 
  BarChart3, 
  History, 
  Settings as SettingsIcon, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  BookOpen,
  Code,
  Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen, activePage, setActivePage }) {
  const { user, logout } = useAuth();

  // Dynamic menu items based on whether user is logged in
  const menuItems = user ? [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Resume Studio', icon: FileText },
    { name: 'Interview Preparation', icon: BookOpen },
    { name: 'Project Recommendations', icon: Code },
    { name: 'Reports', icon: BarChart3 },
    { name: 'History', icon: History },
    { name: 'Profile', icon: UserIcon },
    { name: 'Settings', icon: SettingsIcon },
  ] : [
    { name: 'Login', icon: LogIn },
    { name: 'Register', icon: UserPlus },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Sidebar Header Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shrink-0 animate-pulse">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Resume Intel
          </span>
        </div>
        
        {/* Collapse toggle button inside header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none"
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-2 py-6">
        {menuItems.map((item, index) => {
          const isActive = activePage === item.name;
          
          return (
            <button
              key={index}
              onClick={() => setActivePage(item.name)}
              className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              title={!isOpen ? item.name : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={`transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                {item.name}
              </span>
            </button>
          );
        })}

        {/* Logged in Actions (Logout) */}
        {user && (
          <button
            onClick={() => {
              logout();
              setActivePage('Login');
            }}
            className="flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-semibold text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            title={!isOpen ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
              Logout
            </span>
          </button>
        )}
      </nav>

      {/* Navigation Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className={`rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3 text-xs overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 h-auto' : 'opacity-0 h-0 p-0 border-0'}`}>
          <p className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">Vercel Inspired Design</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
            Clean white and slate spacing with zero emojis.
          </p>
        </div>
      </div>
    </aside>
  );
}
