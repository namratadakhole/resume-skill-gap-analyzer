import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Info, Award, Clock, Star, RefreshCw } from 'lucide-react';

export default function ResumeImprovementChecklist({ results, resumeName, resumeText }) {
  const [checklist, setChecklist] = useState([]);
  
  useEffect(() => {
    if (!results) return;
    
    const storageKey = `checklist_${resumeName || 'default'}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        setChecklist(JSON.parse(stored));
      } catch (e) {
        generateAndSaveChecklist(storageKey);
      }
    } else {
      generateAndSaveChecklist(storageKey);
    }
  }, [results, resumeName]);

  const generateAndSaveChecklist = (key) => {
    const missing = results.skills?.missing || [];
    const text = (resumeText || '').toLowerCase();
    
    const items = [];
    
    // 1. Social Profile Checks
    if (!text.includes('github.com')) {
      items.push({
        id: 'github',
        text: 'Add GitHub Profile',
        priority: 'High',
        reason: 'Recruiters check source repositories for code quality and activity.',
        improvement: '15%',
        time: '15 mins',
        completed: false
      });
    }
    
    if (!text.includes('linkedin.com')) {
      items.push({
        id: 'linkedin',
        text: 'Add LinkedIn URL',
        priority: 'High',
        reason: 'Essential for recruiter candidate profile validation.',
        improvement: '10%',
        time: '10 mins',
        completed: false
      });
    }

    // 2. Missing Skills Checks
    missing.slice(0, 3).forEach((skill, idx) => {
      items.push({
        id: `skill-${idx}`,
        text: `Add ${skill}`,
        priority: 'High',
        reason: `Directly matches a critical missing gap identified in the target role description.`,
        improvement: '12%',
        time: '30 mins',
        completed: false
      });
    });

    // 3. Structural checks
    if (!text.includes('summary') && !text.includes('objective') && !text.includes('profile')) {
      items.push({
        id: 'summary',
        text: 'Improve Professional Summary',
        priority: 'Medium',
        reason: 'Incorporate target job description keywords into the summary hooks.',
        improvement: '8%',
        time: '20 mins',
        completed: false
      });
    }

    // 4. Quantified outcomes
    const hasNumbers = /\d+%|\$\d+|\d+\s*year/i.test(text);
    if (!hasNumbers) {
      items.push({
        id: 'metrics',
        text: 'Add Quantified Achievements',
        priority: 'High',
        reason: 'Bullet points should demonstrate measurable value (e.g., automated deployments by 30%).',
        improvement: '15%',
        time: '45 mins',
        completed: false
      });
    }

    // 5. Internship references
    if (!text.includes('intern') && !text.includes('apprentice')) {
      items.push({
        id: 'internship',
        text: 'Mention Internship Experience',
        priority: 'Medium',
        reason: 'Validates real-world application building under senior mentors.',
        improvement: '8%',
        time: '30 mins',
        completed: false
      });
    }

    // 6. Certifications
    if (!text.includes('certif') && !text.includes('award')) {
      items.push({
        id: 'certifications',
        text: 'Add Certifications',
        priority: 'Medium',
        reason: 'Verifies verified competencies from credential providers (AWS, Docker).',
        improvement: '5%',
        time: '15 mins',
        completed: false
      });
    }

    // 7. Projects
    if (!text.includes('project')) {
      items.push({
        id: 'projects',
        text: 'Add Projects',
        priority: 'High',
        reason: 'Demonstrates coding application capability using missing skills.',
        improvement: '10%',
        time: '60 mins',
        completed: false
      });
    }

    // Fallback default checklist if resume is already highly optimized
    if (items.length === 0) {
      items.push({
        id: 'fine-tune',
        text: 'Fine-tune Action Verbs',
        priority: 'Low',
        reason: 'Swap standard words with strong action verbs like Orchestrated or Scaled.',
        improvement: '3%',
        time: '15 mins',
        completed: false
      });
    }

    setChecklist(items);
    localStorage.setItem(key, JSON.stringify(items));
  };

  const toggleItem = (itemId) => {
    const updated = checklist.map(item => {
      if (item.id === itemId) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setChecklist(updated);
    localStorage.setItem(`checklist_${resumeName || 'default'}`, JSON.stringify(updated));
  };

  // Progress metrics
  const total = checklist.length;
  const completed = checklist.filter(i => i.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Build the ASCII progress block requested:
  // e.g. ███████████░░░░
  const getASCIIProgress = () => {
    const barLength = 15;
    const filledLength = Math.round((percent / 100) * barLength);
    const emptyLength = barLength - filledLength;
    return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  };

  const getPriorityColor = (prio) => {
    if (prio === 'High') return 'text-red-650 bg-red-50 dark:bg-red-950/20';
    if (prio === 'Medium') return 'text-amber-650 bg-amber-50 dark:bg-amber-955/20';
    return 'text-slate-500 bg-slate-50 dark:bg-slate-850';
  };

  return (
    <div className="rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-950 dark:text-white">Resume Improvement Checklist</h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Incremental Optimization Goals</p>
        </div>
        <button 
          onClick={() => generateAndSaveChecklist(`checklist_${resumeName || 'default'}`)}
          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400"
          title="Regenerate Checklist"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Progress indicators */}
      <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
        <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-white">
          <span>Resume Improvement</span>
          <span>{percent}% Complete</span>
        </div>
        
        {/* Styled Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-green-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>

        {/* ASCII Block Visualizer */}
        <div className="text-[10px] font-mono text-slate-400 font-bold text-center tracking-wider">
          {getASCIIProgress()}
        </div>
      </div>

      {/* Checklist list */}
      <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
        {checklist.map(item => (
          <div 
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            {/* Checkbox */}
            <button 
              onClick={() => toggleItem(item.id)}
              className="mt-0.5 text-slate-500 hover:text-green-600 shrink-0"
            >
              {item.completed ? (
                <CheckSquare className="h-4.5 w-4.5 text-green-600" />
              ) : (
                <Square className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Info details */}
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className={`text-[11px] font-bold text-slate-850 dark:text-slate-200 ${item.completed ? 'line-through opacity-50' : ''}`}>
                  {item.text}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
              </div>

              <p className="text-[10px] text-slate-450 font-semibold leading-normal">
                {item.reason}
              </p>

              {/* Sub parameters */}
              <div className="flex gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-green-600" />
                  <span>+{item.improvement} ATS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{item.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
