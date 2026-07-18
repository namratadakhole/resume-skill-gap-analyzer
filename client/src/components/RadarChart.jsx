import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

export default function RechartsRadarChart({ data }) {
  const { settings } = useSettings();

  const isDark = settings.general.theme === 'dark' || 
    (settings.general.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Format categories name to be shorter for presentation
  const formattedData = (data || []).map((item) => ({
    ...item,
    subject: (item?.subject || '')
      .replace(' Development', '')
      .replace(' & Storage', '')
      .replace(' & AI/ML', '')
      .replace(' & Frameworks', ''),
  }));

  if (formattedData.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        No category data available to map.
      </div>
    );
  }

  // Dynamic colors for dark mode support
  const gridColor = isDark ? '#334155' : '#e2e8f0'; // slate-700 vs slate-200
  const tickColor = isDark ? '#94a3b8' : '#475569'; // slate-400 vs slate-600
  const radarColor = isDark ? '#cbd5e1' : '#0f172a'; // slate-300 vs slate-900

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formattedData}>
          <PolarGrid stroke={gridColor} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: tickColor, fontSize: 10, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: isDark ? '#475569' : '#94a3b8', fontSize: 8 }}
            stroke="transparent"
          />
          <Radar
            name="Alignment"
            dataKey="percentage"
            stroke={radarColor}
            fill={radarColor}
            fillOpacity={isDark ? 0.25 : 0.15}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
