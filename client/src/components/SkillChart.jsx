import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../context/SettingsContext';

export default function SkillChart({ matchedCount, missingCount }) {
  const { settings } = useSettings();

  const isDark = settings.general.theme === 'dark' || 
    (settings.general.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const data = [
    { name: 'Matched Skills', value: matchedCount },
    { name: 'Missing Skills', value: missingCount },
  ];

  const COLORS = ['#10b981', '#ef4444']; // emerald-500, red-500

  // Fallback if both are zero
  if (matchedCount + missingCount === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-slate-400 dark:text-slate-500">
        No skill data available.
      </div>
    );
  }

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#1e293b' : '#fff', 
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
              color: isDark ? '#f8fafc' : '#0f172a',
              borderRadius: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
