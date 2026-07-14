import React from 'react';

export default function KPICard({ title, value, subtitle, icon: Icon, progressValue, progressColor = 'bg-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-450 leading-normal">
          {subtitle}
        </span>
      </div>

      {progressValue !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
