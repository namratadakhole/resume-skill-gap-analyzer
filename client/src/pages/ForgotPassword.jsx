import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Sparkles, ArrowLeft, Loader } from 'lucide-react';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-soft"
      >
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sent ? 'Recovery instructions sent' : 'Enter email to receive reset instructions'}
          </p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center">
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 p-4 text-xs text-slate-650 dark:text-slate-350 leading-relaxed border border-blue-100 dark:border-blue-900/50">
              An email containing recovery steps has been dispatched to <strong>{email}</strong>. Please check your inbox and spam folders.
            </div>
            
            <button
              onClick={() => onNavigate && onNavigate('Login')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </button>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-3 text-sm font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-800"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('Login')}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
