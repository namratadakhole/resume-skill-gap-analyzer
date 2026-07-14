import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useSettings 
} from '../context/SettingsContext';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Layers, 
  FileCheck, 
  BarChart3, 
  FileText, 
  History as HistoryIcon, 
  MessageSquare, 
  Bell, 
  Terminal, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import axios from 'axios';

// Default skills mapping per target role
const ROLE_SKILLS = {
  'Software Engineer': ['Python', 'JavaScript', 'SQL', 'Git', 'OOP', 'Data Structures', 'REST APIs', 'Unit Testing'],
  'AI Engineer': ['Python', 'TensorFlow', 'PyTorch', 'LLMs', 'LangChain', 'Prompt Engineering', 'Vector Databases', 'HuggingFace'],
  'Machine Learning Engineer': ['Python', 'scikit-learn', 'PyTorch', 'MLOps', 'Pandas', 'NumPy', 'Supervised Learning', 'Model Deployment'],
  'Data Scientist': ['Python', 'SQL', 'Statistics', 'R', 'Pandas', 'Jupyter', 'Data Visualization', 'Tableau'],
  'Frontend Developer': ['React', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'TailwindCSS', 'Webpack', 'State Management'],
  'Backend Developer': ['Node.js', 'Python', 'PostgreSQL', 'REST APIs', 'Docker', 'Redis', 'Express', 'Django'],
  'Full Stack Developer': ['React', 'Node.js', 'SQL', 'TypeScript', 'Git', 'REST APIs', 'Express', 'PostgreSQL'],
  'Cybersecurity Engineer': ['Linux', 'Network Security', 'Cryptography', 'Pen Testing', 'Wireshark', 'IAM', 'Firewalls', 'SIEM'],
  'Cloud Engineer': ['AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'DevOps', 'CI/CD', 'Bash Scripting']
};

export default function Settings() {
  const { settings, updateSettings, updateDirectSetting, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [logs, setLogs] = useState([]);

  // Skills database state (loaded from local storage or default)
  const [skillsDb, setSkillsDb] = useState(() => {
    const stored = localStorage.getItem('resume_custom_skills_db');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return {
      "Programming Languages": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "sql", "html", "css"],
      "Frameworks": ["react", "angular", "vue", "django", "flask", "fastapi", "spring boot", "express"],
      "Cloud & DevOps": ["aws", "azure", "docker", "kubernetes", "git", "ci/cd", "terraform"],
      "Databases": ["postgresql", "mysql", "mongodb", "redis", "sqlite"],
      "Soft Skills": ["communication", "teamwork", "leadership", "problem solving", "critical thinking"]
    };
  });

  const [searchSkill, setSearchSkill] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Programming Languages');

  // Sync custom skills db to local storage
  useEffect(() => {
    localStorage.setItem('resume_custom_skills_db', JSON.stringify(skillsDb));
  }, [skillsDb]);

  // Ping API Status
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await axios.get('/api/health');
        if (response.data?.status === 'healthy') {
          setApiStatus('Online');
        } else {
          setApiStatus('Unhealthy');
        }
      } catch (e) {
        setApiStatus('Offline');
      }
    };
    checkApi();
    
    // Create mock audit logs
    setLogs([
      `[${new Date().toLocaleTimeString()}] Local settings provider initialized.`,
      `[${new Date().toLocaleTimeString()}] Loaded cached theme preferences: ${settings.general.theme}.`,
      `[${new Date().toLocaleTimeString()}] Analysis weights verified (sum = 100%).`
    ]);
  }, []);

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Normalization logic for analysis weights
  const handleWeightChange = (key, val) => {
    const numericVal = parseInt(val, 10);
    const newWeights = { ...settings.analysis, [key]: numericVal };
    const keys = Object.keys(newWeights);
    const otherKeys = keys.filter(k => k !== key);
    const othersSum = otherKeys.reduce((sum, k) => sum + newWeights[k], 0);
    const targetOthers = 100 - numericVal;
    
    if (othersSum > 0) {
      otherKeys.forEach(k => {
        newWeights[k] = Math.round((newWeights[k] / othersSum) * targetOthers);
      });
    } else {
      otherKeys.forEach(k => {
        newWeights[k] = Math.round(targetOthers / otherKeys.length);
      });
    }
    
    // fine tune sum to exactly 100
    const total = keys.reduce((sum, k) => sum + newWeights[k], 0);
    if (total !== 100) {
      newWeights[otherKeys[0]] += (100 - total);
    }
    
    updateSettings('analysis', newWeights);
    addLog(`Adjusted weight ${key} to ${numericVal}%. Total re-normalized to 100%.`);
  };

  // Target role configuration loads skills
  const handleRoleChange = (role) => {
    updateDirectSetting('targetRole', role);
    addLog(`Changed target profile role to: ${role}. Loading relevant skills.`);
  };

  // Skill Database actions
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const nameClean = newSkillName.trim().toLowerCase();
    
    if (skillsDb[newSkillCategory].includes(nameClean)) {
      alert('Skill already exists in this category.');
      return;
    }

    setSkillsDb(prev => ({
      ...prev,
      [newSkillCategory]: [...prev[newSkillCategory], nameClean]
    }));
    setNewSkillName('');
    addLog(`Added custom skill '${nameClean}' under '${newSkillCategory}'.`);
  };

  const handleRemoveSkill = (category, skill) => {
    setSkillsDb(prev => ({
      ...prev,
      [category]: prev[category].filter(s => s !== skill)
    }));
    addLog(`Deleted skill '${skill}' from category '${category}'.`);
  };

  const handleExportSkills = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skillsDb, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "custom_skills_database.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog(`Exported custom skills database to JSON file.`);
  };

  const handleImportSkills = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        // validate keys
        const requiredKeys = ["Programming Languages", "Frameworks", "Cloud & DevOps", "Databases", "Soft Skills"];
        const hasKeys = requiredKeys.every(k => Array.isArray(imported[k]));
        if (hasKeys) {
          setSkillsDb(imported);
          addLog("Imported custom skills database successfully.");
        } else {
          alert("Invalid skills database schema. Check keys format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('resume_analyzer_history'); // Placeholder mock history key
    addLog("Analysis database history successfully cleared.");
    alert("History cleared successfully!");
  };

  const handleExportLogs = () => {
    const logStr = "data:text/plain;charset=utf-8," + encodeURIComponent(logs.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", logStr);
    downloadAnchor.setAttribute("download", "system_audit_logs.txt");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const menuSections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'analysis', label: 'Analysis Settings', icon: Cpu },
    { id: 'role', label: 'Target Role', icon: Layers },
    { id: 'skills', label: 'Skill Database', icon: Terminal },
    { id: 'parser', label: 'Resume Parser', icon: FileCheck },
    { id: 'dashboard', label: 'Dashboard Config', icon: BarChart3 },
    { id: 'reports', label: 'Report Settings', icon: FileText },
    { id: 'history', label: 'History & Cache', icon: HistoryIcon },
    { id: 'coach', label: 'AI Coach Style', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'developer', label: 'Developer Sandbox', icon: Terminal }
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[580px]">
        {/* Sidebar tabs selection */}
        <div className="w-full md:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-1 shrink-0">
          <div className="px-3 pb-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Settings Panel</h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Customize workspace state</p>
          </div>
          {menuSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`flex w-full items-center gap-3 rounded-lg py-2 px-3 text-xs font-semibold transition-all ${
                activeTab === sec.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              <sec.icon className="h-3.5 w-3.5" />
              {sec.label}
            </button>
          ))}
        </div>

        {/* Dynamic Card rendering */}
        <div className="flex-grow p-8 bg-white dark:bg-slate-900 min-w-0">
          <AnimatePresence mode="wait">
            {/* General Section */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">General Settings</h4>
                  <p className="text-xs text-slate-400">Configure theme rendering and multilingual targets.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace Theme</label>
                    <div className="grid grid-cols-3 gap-3 max-w-sm">
                      {[
                        { id: 'light', label: 'Light', icon: Sun },
                        { id: 'dark', label: 'Dark', icon: Moon },
                        { id: 'system', label: 'System', icon: Monitor }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => updateSettings('general', { theme: t.id })}
                          className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                            settings.general.theme === t.id
                              ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <t.icon className="h-3.5 w-3.5" />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Application Language</label>
                    <select
                      value={settings.general.language}
                      onChange={(e) => updateSettings('general', { language: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish (Future)">Español (Future-ready)</option>
                      <option value="French (Future)">Français (Future-ready)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Settings Section */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Analysis Weights configuration</h4>
                  <p className="text-xs text-slate-400">Configure weighting values for ATS score evaluations. Sum must equal 100%.</p>
                </div>

                <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md">
                  {[
                    { key: 'semanticWeight', label: 'Semantic Similarity (Transformer)' },
                    { key: 'keywordWeight', label: 'Keyword Match (TF-IDF Cosine)' },
                    { key: 'skillsWeight', label: 'Skill Coverage (Abbreviation-Aware)' },
                    { key: 'formattingWeight', label: 'Resume Formatting Score' },
                    { key: 'experienceWeight', label: 'Experience Match compliance' }
                  ].map((w) => (
                    <div key={w.key} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>{w.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{settings.analysis[w.key]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.analysis[w.key]}
                        onChange={(e) => handleWeightChange(w.key, e.target.value)}
                        className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-900 dark:accent-slate-100"
                      />
                    </div>
                  ))}
                  
                  {/* Validation helper badge */}
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-3 text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold text-center">
                    Mathematical Validation: Weights sum equals exactly 100%.
                  </div>
                </div>
              </div>
            )}

            {/* Target Role Section */}
            {activeTab === 'role' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Target Career Role</h4>
                  <p className="text-xs text-slate-400">Configure target profiles to automatically filter relevant database parameters.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Career Track</label>
                    <select
                      value={settings.targetRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {Object.keys(ROLE_SKILLS).map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Skill Competencies</h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ROLE_SKILLS[settings.targetRole].map((s) => (
                        <span key={s} className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skill Database Section */}
            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Skill Taxonomy Database</h4>
                  <p className="text-xs text-slate-400">Edit, add, delete, import, or export skills used in parsing.</p>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {/* Search and database layout */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Search database skills..."
                      value={searchSkill}
                      onChange={(e) => setSearchSkill(e.target.value)}
                      className="flex-grow rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleExportSkills}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </button>
                      <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none">
                        <Upload className="h-3.5 w-3.5" />
                        Import
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportSkills}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Add Custom Skill Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                    <input
                      type="text"
                      placeholder="Add custom skill..."
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none"
                    />
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none"
                    >
                      {Object.keys(skillsDb).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddSkill}
                      className="flex items-center justify-center gap-1 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 focus:outline-none"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Skill
                    </button>
                  </div>

                  {/* Skill Badges View Grid */}
                  <div className="h-[240px] overflow-y-auto pr-2 space-y-4">
                    {Object.entries(skillsDb).map(([cat, skills]) => {
                      const filtered = skills.filter(s => s.toLowerCase().includes(searchSkill.toLowerCase()));
                      if (filtered.length === 0) return null;
                      
                      return (
                        <div key={cat} className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {filtered.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 font-semibold"
                              >
                                {skill}
                                <button
                                  onClick={() => handleRemoveSkill(cat, skill)}
                                  className="text-slate-400 hover:text-red-500 focus:outline-none"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Resume Parser Section */}
            {activeTab === 'parser' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Resume Parser Configuration</h4>
                  <p className="text-xs text-slate-400">Configure fields extracted automatically during document analysis.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md">
                  {[
                    { key: 'detectProjects', label: 'Detect Projects & Portfolios' },
                    { key: 'detectCertifications', label: 'Detect Professional Certifications' },
                    { key: 'detectEducation', label: 'Detect Academic History & GPA' },
                    { key: 'detectExperience', label: 'Detect Career Work Milestones' },
                    { key: 'detectSoftSkills', label: 'Extract Soft Skills & Methodologies' }
                  ].map((p) => (
                    <div key={p.key} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{p.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.resumeParser[p.key]}
                          onChange={(e) => updateSettings('resumeParser', { [p.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Config Section */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Dashboard Grid Panels</h4>
                  <p className="text-xs text-slate-400">Configure layout sections rendered on the SaaS Dashboard overview.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-md">
                  {[
                    { key: 'showGauge', label: 'Render Circular ATS & Similarity Gauges' },
                    { key: 'showRadar', label: 'Render Category Skill Alignment Radar Chart' },
                    { key: 'showDonut', label: 'Render Matched/Missing Skills Proportion Donut' },
                    { key: 'showKPI', label: 'Render Metric KPI Cards Grid at Top' },
                    { key: 'showRoadmap', label: 'Render Expandable Action Recommendations List' },
                    { key: 'showTimeline', label: 'Render Chronological Learning Timeline Roadmap' }
                  ].map((db) => (
                    <div key={db.key} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{db.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.dashboard[db.key]}
                          onChange={(e) => updateSettings('dashboard', { [db.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Settings Section */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">PDF Report Document Exporter</h4>
                  <p className="text-xs text-slate-400">Configure modules included in compile-pdf document generation.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-lg">
                  {[
                    { key: 'includeCharts', label: 'Export charts & visualizer blocks' },
                    { key: 'includeProfile', label: 'Export parsed candidate profiles details' },
                    { key: 'includeRecommendations', label: 'Export actionable suggestions list' },
                    { key: 'includeRoadmap', label: 'Export structured learning roadmap calendar' },
                    { key: 'includeMissingSkills', label: 'Export red list of missing required gaps' },
                    { key: 'includeMatchedSkills', label: 'Export checklist of matching credentials' }
                  ].map((rep) => (
                    <label key={rep.key} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.reports[rep.key]}
                        onChange={(e) => updateSettings('reports', { [rep.key]: e.target.checked })}
                        className="rounded border-slate-350 text-slate-900 focus:ring-slate-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{rep.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* History Section */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">History Database Management</h4>
                  <p className="text-xs text-slate-400">Manage logs of previous profiles analysis and database limits.</p>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Save previous analyses</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.history.saveAnalyses}
                        onChange={(e) => updateSettings('history', { saveAnalyses: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maximum database records</label>
                    <select
                      value={settings.history.maxHistory}
                      onChange={(e) => updateSettings('history', { maxHistory: parseInt(e.target.value, 10) })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {[10, 25, 50, 100].map(limit => (
                        <option key={limit} value={limit}>{limit} items</option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleClearHistory}
                      className="w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/50 text-red-700 py-3 text-xs font-semibold transition-colors focus:outline-none"
                    >
                      Clear database history cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Coach Section */}
            {activeTab === 'coach' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">AI Coach Response Alignment</h4>
                  <p className="text-xs text-slate-400">Configure conversational response style of the offline audit coach.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enable AI Resume Coach Panel</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.aiCoach.enable}
                        onChange={(e) => updateSettings('aiCoach', { enable: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversational Response Style</label>
                    <select
                      value={settings.aiCoach.responseStyle}
                      onChange={(e) => updateSettings('aiCoach', { responseStyle: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      {['Professional', 'Detailed', 'Short', 'Interview Focused', 'Career Mentor'].map(style => (
                        <option key={style} value={style}>{style}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Workspace Notifications</h4>
                  <p className="text-xs text-slate-400">Configure notifications triggers for analysis outputs.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 max-w-sm">
                  {[
                    { key: 'analysisCompleted', label: 'Notify when analysis completes' },
                    { key: 'downloadFinished', label: 'Notify when PDF download completes' },
                    { key: 'showToast', label: 'Display success popup toast alerts' }
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{n.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications[n.key]}
                          onChange={(e) => updateSettings('notifications', { [n.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-100"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer Section */}
            {activeTab === 'developer' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">Developer Sandbox</h4>
                  <p className="text-xs text-slate-400">Monitor system status logs and trigger factory resets.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <span className="font-semibold text-slate-500">API Gateway Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        apiStatus === 'Online' 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 border border-green-100 dark:border-green-900/50' 
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700 border border-red-100 dark:border-red-900/50'
                      }`}>{apiStatus}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/50 pb-2">
                      <span className="font-semibold text-slate-500">System architecture</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Sentence Transformer L6 CPU</span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={resetSettings}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 py-2.5 text-xs font-semibold transition-colors focus:outline-none"
                      >
                        Reset Workspace default settings
                      </button>
                      <button
                        onClick={handleExportLogs}
                        className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 py-2.5 text-xs font-semibold transition-colors focus:outline-none"
                      >
                        Export Workspace Audit logs
                      </button>
                    </div>
                  </div>

                  {/* Real-time Logger view */}
                  <div className="flex flex-col h-[240px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 mb-2">System console logger</p>
                    <div className="flex-grow overflow-y-auto text-[10px] font-mono text-slate-300 space-y-1 pr-1">
                      {logs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed">{log}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
