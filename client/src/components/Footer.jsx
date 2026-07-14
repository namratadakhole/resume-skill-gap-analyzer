import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500 dark:text-slate-450 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Resume Intelligence Systems. All rights reserved.</p>
        <div className="flex gap-4 font-semibold text-slate-400 dark:text-slate-500">
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">API Status</a>
        </div>
      </div>
    </footer>
  );
}
