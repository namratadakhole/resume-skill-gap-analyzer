import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, BookOpen, Terminal, CheckCircle2, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';

export default function RecommendationCard({ skill, action, type, index }) {
  const [isOpen, setIsOpen] = useState(false);

  // Heuristic-based properties for the enterprise upgrade
  let priority = 'Medium';
  let priorityColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50';
  let learningTime = '10-15 hours';
  let Icon = BookOpen;

  if (type === 'Certification') {
    priority = 'High';
    priorityColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-450 border-rose-100 dark:border-rose-900/50';
    learningTime = '30-40 hours';
    Icon = Award;
  } else if (type === 'Portfolio Project') {
    priority = 'High';
    priorityColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-450 border-rose-100 dark:border-rose-900/50';
    learningTime = '15-20 hours';
    Icon = Terminal;
  } else if (type === 'Optimization') {
    priority = 'Low';
    priorityColor = 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700';
    learningTime = '2-3 hours';
    Icon = CheckCircle2;
  }

  // Parse resources from action string (after "We recommend:")
  const recommendSplit = action.split('We recommend:');
  const actionText = recommendSplit[0].trim();
  const resourceSuggested = recommendSplit[1] 
    ? recommendSplit[1].replace(/\.$/, '').trim() 
    : `Standard ${skill} Developer Documentation`;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-soft transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350">
            {index}
          </span>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {skill}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Badge */}
          <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${priorityColor}`}>
            {priority} Priority
          </span>
          {/* Collapse icon */}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 p-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500">Objective Action</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{actionText}</p>
                </div>
              </div>

              {/* Extra details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-11 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-450 text-xs">
                  <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                  <span>Time investment: <strong>{learningTime}</strong></span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-450">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400">Suggested Resource:</span>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(resourceSuggested)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {resourceSuggested}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
