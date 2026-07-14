import React from 'react';
import { Check, X, Plus } from 'lucide-react';

export default function SkillBadge({ name, type }) {
  let badgeClasses = 'bg-slate-50 text-slate-700 border-slate-200';
  let Icon = null;

  if (type === 'matched') {
    badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50';
    Icon = Check;
  } else if (type === 'missing') {
    // Red outlined badges for missing skills
    badgeClasses = 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50/50';
    Icon = X;
  } else if (type === 'extra') {
    badgeClasses = 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100/50';
    Icon = Plus;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${badgeClasses}`}>
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {name}
    </span>
  );
}
