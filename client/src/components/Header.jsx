import React from 'react';
import { Menu, Sparkles, RefreshCw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Header({ sidebarOpen, setSidebarOpen }) {
  const { setResumeText, setJobDescText, setFileName, setAnalysisResults } = useSettings();

  const handleNewAnalysis = () => {
    setResumeText('');
    setJobDescText('');
    setFileName('');
    setAnalysisResults(null);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Branding Title */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span className="font-bold tracking-tight text-slate-900 dark:text-white">
            Resume Skill Gap Analyzer
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <button
          onClick={handleNewAnalysis}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3.5 py-1.5 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none shadow-sm font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New Analysis
        </button>
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-800"></span>
        <span>V1.0.0</span>
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-800"></span>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-600 dark:text-slate-350 uppercase tracking-wider">
          Enterprise
        </span>
      </div>
    </header>
  );
}
