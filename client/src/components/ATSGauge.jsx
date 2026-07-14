import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

export default function ATSGauge({ score, tier }) {
  const { settings } = useSettings();

  // Reactive dark mode detection
  const isDark = settings.general.theme === 'dark' || 
    (settings.general.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Determine matching colors
  let color = isDark ? '#f8fafc' : '#0f172a'; // light slate-50 vs dark slate-900
  let badgeColor = 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-950 dark:border-slate-200';
  const trackColor = isDark ? '#1e293b' : '#f1f5f9'; // slate-800 vs slate-100

  if (tier === 'High Match') {
    color = '#10b981'; // emerald-500
    badgeColor = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/50';
  } else if (tier === 'Medium Match') {
    color = '#f59e0b'; // amber-500
    badgeColor = 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/50';
  } else if (tier === 'Low Match') {
    color = '#ef4444'; // red-500
    badgeColor = 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 border-rose-100 dark:border-rose-900/50';
  }

  const data = [
    {
      name: 'ATS Score',
      value: score,
      fill: color,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* RadialBarChart representing the score ring */}
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="95%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: trackColor }}
              clockWise
              dataKey="value"
              cornerRadius={8}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Floating text in the center */}
        <div className="absolute text-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {score}%
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 mt-0.5">
            ATS Score
          </span>
        </div>
      </div>

      {/* Tier Badge */}
      <span className={`mt-4 rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors ${badgeColor}`}>
        {tier}
      </span>
    </div>
  );
}
