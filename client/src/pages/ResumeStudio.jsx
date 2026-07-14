import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  CheckCircle, 
  Edit3, 
  Search, 
  FileSearch, 
  Check, 
  Loader,
  AlertCircle,
  X,
  BookOpen,
  Sparkles,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
  Info,
  Copy,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  Terminal,
  ClipboardList,
  Flame,
  Lightbulb,
  FileDown
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

// API Services
import { 
  getResumes, 
  uploadResumeFile, 
  renameResume, 
  deleteResume, 
  downloadResume, 
  setActiveResume,
  getAnalyses,
  generateRewrite,
  getRewritesList,
  downloadInterviewReport
} from '../services/api';

// Components
import UploadCard from '../components/UploadCard';
import ATSGauge from '../components/ATSGauge';
import KPICard from '../components/KPICard';
import SkillBadge from '../components/SkillBadge';
import RadarChart from '../components/RadarChart';
import ResumeViewer from '../components/ResumeViewer';
import PDFDownloadButton from '../components/PDFDownloadButton';

export default function ResumeStudio() {
  const { 
    settings,
    analysisResults: results,
    setAnalysisResults: setResults,
    resumeText: workspaceText,
    setResumeText,
    fileName: workspaceFileName,
    setFileName
  } = useSettings();

  // Active Tab: 'upload', 'analysis', 'rewrite', 'versions', 'export'
  const [activeTab, setActiveTab] = useState('upload');

  // --- GENERAL STATES ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- TAB 1: UPLOAD STATES ---
  const [uploading, setUploading] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // --- TAB 2: ANALYSIS STATES ---
  const [analysisSubTab, setAnalysisSubTab] = useState('overview');

  // --- TAB 3: REWRITE STATES ---
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [activeResumeName, setActiveResumeName] = useState('');
  const [activeResumeText, setActiveResumeText] = useState('');
  const [activeJobDesc, setActiveJobDesc] = useState('');
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [rewriteSections, setRewriteSections] = useState([]);
  const [rewriteHistory, setRewriteHistory] = useState([]);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState({
    "Professional Summary": true,
    "Skills": false,
    "Projects": false,
    "Experience": false,
    "Achievements": false
  });
  const [copiedSection, setCopiedSection] = useState(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // --- TAB 4: VERSIONS STATES ---
  const [resumes, setResumes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResume, setPreviewResume] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Load baseline datasets on mount
  useEffect(() => {
    fetchResumesList();
    loadAnalysesAndRewriteHistory();
  }, []);

  const fetchResumesList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch resumes from database.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysesAndRewriteHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      const analysesData = await getAnalyses();
      const rewritesHistoryData = await getRewritesList();
      setAnalyses(analysesData);
      setRewriteHistory(rewritesHistoryData);

      // Default to active workspace analysis if available
      if (results) {
        setActiveAnalysis(results);
        setActiveResumeName(workspaceFileName || 'Active_Resume.txt');
        setActiveResumeText(workspaceText || '');
        setActiveJobDesc('Target Role: ' + results.job_title);
        
        const matchingRewrite = rewritesHistoryData.find(h => h.resume_name === workspaceFileName);
        if (matchingRewrite) {
          setRewriteSections(matchingRewrite.sections);
        }
      } else if (analysesData.length > 0) {
        const latest = analysesData[0];
        setSelectedAnalysisId(latest.id);
        handleSelectAnalysis(latest.id, analysesData, rewritesHistoryData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sync rewrite history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectAnalysis = (id, list = analyses, history = rewriteHistory) => {
    if (!id) return;
    const item = list.find(a => a.id === id);
    if (!item) return;

    setActiveAnalysis(item.results);
    setActiveResumeName(item.resume_filename);
    const textContent = item.results?.parser_results?.resume_text || workspaceText || 'Original resume text content...';
    setActiveResumeText(textContent);
    setActiveJobDesc('Target Position: ' + item.job_title);

    const matchingRewrite = history.find(h => h.resume_name === item.resume_filename);
    if (matchingRewrite) {
      setRewriteSections(matchingRewrite.sections);
    } else {
      setRewriteSections([]);
    }
  };

  // --- TAB 1 ACTIONS ---
  const handleUpload = async (file) => {
    if (!file) return;
    if (workspaceFileName) {
      const confirmReplace = window.confirm("Are you sure you want to replace the current resume?");
      if (!confirmReplace) return;
    }
    setUploading(true);
    setUploadSuccess(false);
    setError(null);
    try {
      const data = await uploadResumeFile(file, targetRole);
      setFileName(file.name);
      setResumeText(data.text || '');
      setUploadSuccess(true);
      await fetchResumesList();
      await loadAnalysesAndRewriteHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload resume file.');
    } finally {
      setUploading(false);
    }
  };

  // --- TAB 3 REWRITE ACTIONS ---
  const handleTriggerRewrite = async () => {
    if (!activeAnalysis) {
      setError('Select or perform a resume analysis first.');
      return;
    }
    try {
      setRewriteLoading(true);
      setError(null);
      const response = await generateRewrite(
        activeResumeName,
        activeResumeText,
        activeJobDesc,
        activeAnalysis
      );
      setRewriteSections(response.sections);
      const updatedHistory = await getRewritesList();
      setRewriteHistory(updatedHistory);
    } catch (err) {
      console.error(err);
      setError('AI Rewrite engine generation failed.');
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleAcceptRewriteSection = (secName, improvedText) => {
    setRewriteSections(prev => 
      prev.map(s => s.name === secName ? { ...s, accepted: true, original_text: s.original_text, improved_text: improvedText } : s)
    );
  };

  const handleCopy = (text, name) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(name);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getCompiledResumeText = () => {
    let compiled = activeResumeText;
    rewriteSections.forEach(sec => {
      if (sec.original_text && sec.original_text.trim() && compiled.includes(sec.original_text)) {
        compiled = compiled.replace(sec.original_text, `[REWRITTEN ${sec.name.toUpperCase()}]\n${sec.improved_text}`);
      } else {
        compiled += `\n\n[REWRITTEN ${sec.name.toUpperCase()}]\n${sec.improved_text}`;
      }
    });
    return compiled;
  };

  // --- TAB 4 VERSIONS ACTIONS ---
  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !renameTarget) return;
    try {
      await renameResume(renameTarget.id, newName);
      setRenameTarget(null);
      setNewName('');
      await fetchResumesList();
    } catch (err) {
      console.error(err);
      setError('Rename operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resume?')) return;
    try {
      await deleteResume(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      await fetchResumesList();
    } catch (err) {
      console.error(err);
      setError('Failed to delete resume.');
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const blobData = await downloadResume(id);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      setError('Failed to download resume file.');
    }
  };

  const handleSetActive = async (id) => {
    try {
      setLoading(true);
      const updated = await setActiveResume(id);
      setFileName(updated.filename);
      setResumeText(updated.text);
      if (updated.ats_score) {
        const analysesData = await getAnalyses();
        const match = analysesData.find(a => a.resume_filename === updated.filename);
        if (match) setResults(match.results);
      }
      await fetchResumesList();
    } catch (err) {
      console.error(err);
      setError('Failed to toggle active resume state.');
    } finally {
      setLoading(false);
    }
  };

  // --- REWRITE OPTIMIZATION SUGGESTIONS ---
  const getRewriteSuggestions = () => {
    if (!results) return [];
    const missing = results.skills?.missing || [];
    if (missing.length === 0) return [];
    
    const rewrites = [];
    const missingSet = new Set(missing.map(s => s.toLowerCase()));

    if (missingSet.has('docker') || missingSet.has('kubernetes')) {
      rewrites.push({
        before: "Deployed and configured backend services on virtual machines.",
        after: "Containerized backend services with Docker; authored Kubernetes manifests and helm charts to deploy high-availability service pods.",
        skill: "Docker / Kubernetes"
      });
    }
    if (missingSet.has('aws') || missingSet.has('gcp') || missingSet.has('azure')) {
      rewrites.push({
        before: "Stored files and uploaded web assets to standard servers.",
        after: "Architected cloud asset storage systems utilizing AWS S3, reducing operational server costs by leveraging serverless endpoints.",
        skill: "AWS / Cloud Platforms"
      });
    }
    if (missingSet.has('postgresql') || missingSet.has('redis')) {
      rewrites.push({
        before: "Handled SQL queries and configured relational database models.",
        after: "Optimized complex PostgreSQL relational models, implementing indexes and redis cache tables to reduce API payload latency.",
        skill: "PostgreSQL / Redis"
      });
    }
    if (missingSet.has('fastapi') || missingSet.has('django') || missingSet.has('node.js')) {
      rewrites.push({
        before: "Wrote backend APIs and connected frontend features.",
        after: "Engineered scalable RESTful web server APIs using FastAPI, establishing unit testing workflows to verify payload outputs.",
        skill: "FastAPI / Backend Frameworks"
      });
    }

    if (rewrites.length === 0) {
      const sample = missing.slice(0, 2).join(' and ');
      rewrites.push({
        before: "Collaborated on technical projects and developed codebases.",
        after: `Integrated ${sample} workflows across software repositories, designing clean structures to verify component outputs.`,
        skill: sample
      });
    }
    return rewrites;
  };

  const getMetricColor = (score) => {
    if (score >= 80) return 'text-green-650 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
    if (score >= 50) return 'text-yellow-650 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';
    return 'text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
  };

  const toggleComparisonSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Resume Studio</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Your centralized space to upload, analyze, optimize, and manage multi-version resumes.</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold uppercase tracking-wider overflow-x-auto">
        {[
          { id: 'upload', label: 'Upload Resume' },
          { id: 'analysis', label: 'Resume Analysis' },
          { id: 'rewrite', label: 'AI Resume Rewrite' },
          { id: 'versions', label: 'Resume Versions' },
          { id: 'export', label: 'Export Documents' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setError(null);
            }}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-slate-900 dark:border-slate-100 text-slate-955 dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-850'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Job Role / Position</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 placeholder-slate-450 focus:border-slate-400 focus:outline-none"
                  />
                </div>
                <UploadCard 
                  onFileUpload={handleUpload} 
                  fileName={workspaceFileName} 
                  isLoading={uploading} 
                  error={null} 
                />
              </div>

              {uploadSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 p-4 text-xs font-semibold text-green-650 dark:text-green-400">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                  Resume uploaded and versions synced successfully! Select 'Resume Analysis' or 'AI Resume Rewrite' tab to view findings.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Active Document</h3>
              {workspaceFileName ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{workspaceFileName}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Target: {targetRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="w-full text-center text-xs font-bold bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 py-2.5 rounded-lg"
                  >
                    View Analysis Results
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">No active resume loaded in the workspace. Upload a resume file to get started.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (() => {
          if (!results) {
            return (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft max-w-xl mx-auto space-y-4">
                <FileSearch className="h-10 w-10 text-slate-450 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Analysis Data Loaded</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Please upload your resume in the 'Upload Resume' tab, then run a semantic match analysis inside the Dashboard page to view detailed findings here.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-bold"
                >
                  Go to Upload Tab
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-955 dark:text-white">{workspaceFileName}</h3>
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Target Position: {results.job_title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded border border-slate-200 dark:border-slate-800">
                    Tier: {results.match_tier || 'Medium Match'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft flex flex-col items-center justify-center space-y-4">
                  <ATSGauge score={results.ats_score} />
                  <div className="text-center">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate ATS Score</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                      Weighted score: 30% Similarity, 20% TF-IDF, 30% Skill coverage, 10% Formatting, 10% Experience.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                  <h4 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Parser Dimensions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Semantic Similarity', val: results.semantic_score, desc: 'Sentence transformer embeddings match' },
                      { label: 'Keyword Density (TF-IDF)', val: results.keyword_score, desc: 'Technical keywords relevance check' },
                      { label: 'Skill Gap Coverage', val: results.skills_match_score, desc: 'Proportion of essential requirements matched' },
                      { label: 'Formatting Compliance', val: results.formatting_score, desc: 'Structure, margins, and layout validation' },
                    ].map(card => (
                      <div key={card.label} className="p-3 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1 bg-slate-50/20 dark:bg-slate-900/30">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                        <div className="flex justify-between items-baseline">
                          <span className="text-base font-black text-slate-900 dark:text-white">{card.val}%</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getMetricColor(card.val)}`}>
                            {card.val >= 80 ? 'Optimal' : card.val >= 50 ? 'Warning' : 'Critical'}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-slate-500 leading-normal">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                  <h4 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Core Skills Matrix</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Matched Skills ({results.skills?.matched?.length || 0})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.skills?.matched?.map(s => <SkillBadge key={s} name={s} matched={true} />) || <span className="text-xs text-slate-400">None detected.</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-red-650 uppercase tracking-widest">Missing Skills ({results.skills?.missing?.length || 0})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.skills?.missing?.map(s => <SkillBadge key={s} name={s} matched={false} />) || <span className="text-xs text-slate-400">None missing. Perfect overlap!</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                  <h4 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Analysis Bullet Suggestions</h4>
                  <div className="space-y-3.5">
                    {getRewriteSuggestions().map((s, i) => (
                      <div key={i} className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                          <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
                          <span>{s.skill}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 font-mono text-[9.5px] leading-normal text-slate-650 dark:text-slate-350">
                          <div><span className="text-red-500 font-bold">Original:</span> {s.before}</div>
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1"><span className="text-green-500 font-bold">AI Improved:</span> {s.after}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'rewrite' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Select Analysis Profile to rewrite:</span>
              <select
                value={selectedAnalysisId}
                onChange={(e) => {
                  setSelectedAnalysisId(e.target.value);
                  handleSelectAnalysis(e.target.value);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-slate-400 focus:outline-none"
              >
                <option value="">Select Profile...</option>
                {analyses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.resume_filename} ({a.job_title})
                  </option>
                ))}
              </select>
            </div>

            {activeAnalysis ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-slate-450" />
                      {activeResumeName}
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{activeJobDesc}</p>
                  </div>
                  <button
                    onClick={handleTriggerRewrite}
                    disabled={rewriteLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold shadow-soft"
                  >
                    {rewriteLoading ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {rewriteLoading ? 'Optimizing...' : 'Generate AI Rewrites'}
                  </button>
                </div>

                {rewriteSections.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">AI Optimized versions. Open sections to preview and accept changes.</span>
                      <button
                        onClick={() => setShowFullPreview(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Full Resume
                      </button>
                    </div>

                    <div className="space-y-4">
                      {rewriteSections.map(sec => {
                        const isExpanded = expandedCards[sec.name];
                        return (
                          <div key={sec.name} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
                            <div 
                              onClick={() => setExpandedCards(prev => ({ ...prev, [sec.name]: !prev[sec.name] }))}
                              className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/40 dark:hover:bg-slate-900/40 select-none border-b border-slate-100 dark:border-slate-850"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-900 dark:text-white font-bold text-xs shrink-0">
                                  {sec.name[0]}
                                </div>
                                <h4 className="text-xs font-bold text-slate-955 dark:text-white">{sec.name}</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                {sec.accepted && (
                                  <span className="px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-600 border border-green-100/50 text-[9px] font-bold uppercase tracking-wider">
                                    Accepted
                                  </span>
                                )}
                                {isExpanded ? <ChevronUp className="h-4.5 w-4.5 text-slate-400" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-400" />}
                              </div>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/20 dark:bg-slate-900/20 text-xs">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Original text</p>
                                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 leading-relaxed font-mono text-[10px] whitespace-pre-wrap min-h-[140px] text-slate-650 dark:text-slate-350">
                                        {sec.original_text || 'None set.'}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Improved version</p>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleCopy(sec.improved_text, sec.name)}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-500"
                                            title="Copy to clipboard"
                                          >
                                            {copiedSection === sec.name ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                          </button>
                                          <button
                                            onClick={() => handleAcceptRewriteSection(sec.name, sec.improved_text)}
                                            className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${sec.accepted ? 'bg-green-600 border-green-600 text-white' : 'bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-950 dark:border-slate-100'}`}
                                          >
                                            {sec.accepted ? 'Accepted' : 'Accept Rewrite'}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 leading-relaxed font-mono text-[10px] whitespace-pre-wrap min-h-[140px] text-slate-900 dark:text-white">
                                        {sec.improved_text}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft max-w-xl mx-auto space-y-4">
                <Sparkles className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-905 dark:text-white">No analysis profile selected</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Please choose a valid resume analysis from the selector menu above or run an audit inside the Dashboard page to build a rewrite mapping profile.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-soft">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search versions..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {selectedIds.length === 2 && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-650 text-white px-4 py-2.5 text-xs font-bold shadow-soft"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Compare Selected Versions
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.filter(r => r.filename.toLowerCase().includes(searchQuery.toLowerCase())).map(resumeItem => {
                const isSelected = selectedIds.includes(resumeItem.id);
                return (
                  <div key={resumeItem.id} className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-soft space-y-4 transition-all ${resumeItem.is_active ? 'border-slate-900 dark:border-slate-200 ring-1 ring-slate-955/5' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${resumeItem.is_active ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-50 text-slate-500'}`}>
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-950 dark:text-white truncate max-w-[140px]">{resumeItem.filename}</p>
                          <p className="text-[9px] text-slate-450 uppercase tracking-widest font-black mt-0.5">{resumeItem.version || 'v1'} | {resumeItem.target_role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleComparisonSelect(resumeItem.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-purple-650 focus:ring-purple-500"
                        />
                        {resumeItem.is_active ? (
                          <span className="px-2 py-0.5 rounded bg-slate-955 dark:bg-slate-100 text-white dark:text-slate-900 text-[8px] font-black uppercase tracking-wider">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(resumeItem.id)}
                            className="text-[8px] font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wider"
                          >
                            Set Active
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-100 dark:border-slate-850 pt-3">
                      <span>ATS Score: {resumeItem.ats_score ? `${resumeItem.ats_score}%` : 'Not audited'}</span>
                      <span>Words: {resumeItem.word_count || 0}</span>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setNewName(resumeItem.filename);
                            setRenameTarget(resumeItem);
                          }}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-slate-500"
                          title="Rename document"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(resumeItem.id, resumeItem.filename)}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-slate-500"
                          title="Download file"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        {!resumeItem.is_active && (
                          <button
                            onClick={() => handleDelete(resumeItem.id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded text-red-650"
                            title="Delete permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setPreviewResume(resumeItem)}
                        className="text-[10px] font-bold text-slate-700 dark:text-slate-350 hover:underline"
                      >
                        Preview content
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
            <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Document Export Wizard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              {[
                { title: 'Original Resume File', desc: 'Download the source resume file from document versions.', icon: FileText, action: () => {
                  const active = resumes.find(r => r.is_active);
                  if (active) handleDownload(active.id, active.filename);
                  else setError('Please select an active resume version first.');
                }},
                { title: 'AI Improved Resume', desc: 'Download accepted AI optimized content in plain text format.', icon: Sparkles, action: () => {
                  const active = resumes.find(r => r.is_active);
                  if (!active) {
                    setError('Select an active resume version first.');
                    return;
                  }
                  const text = getCompiledResumeText();
                  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.setAttribute('download', `Optimized_${active.filename.replace(/\.[^/.]+$/, "")}.txt`);
                  document.body.appendChild(a);
                  a.click();
                  a.parentNode.removeChild(a);
                }},
                { title: 'ATS Evaluation Report', desc: 'Download standard PDF matching score audit summary report.', icon: FileDown, action: () => {
                  const active = resumes.find(r => r.is_active);
                  if (active) {
                    const btn = document.getElementById('ats-pdf-download-btn-raw');
                    if (btn) btn.click();
                    else setError('Please audit the active resume in Dashboard page to compile ATS PDF report.');
                  } else {
                    setError('Select an active resume version first.');
                  }
                }},
                { title: 'AI Mock Interview Report', desc: 'Download latest question logs & transcription evaluation.', icon: Award, action: () => {
                  setError('To export Interview Report PDFs, navigate to the Reports page to download completed voice records.');
                }},
              ].map(card => (
                <div key={card.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-slate-950 dark:text-white leading-normal">{card.title}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{card.desc}</p>
                  </div>
                  <button
                    onClick={card.action}
                    className="w-full text-center py-2 bg-slate-955 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-bold hover:opacity-90 transition-opacity"
                  >
                    Export Document
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden">
              <PDFDownloadButton />
            </div>
          </div>
        )}

      </div>

      {previewResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 p-4">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-soft max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider">Preview Content: {previewResume.filename}</h3>
              <button onClick={() => setPreviewResume(null)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-slate-500">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-350">
              {previewResume.text || 'No text extracted.'}
            </div>
          </div>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleRename} className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-955 p-5 shadow-soft space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Rename Resume File</h4>
              <button type="button" onClick={() => setRenameTarget(null)} className="p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-400 uppercase tracking-widest">New Filename</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => setRenameTarget(null)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg">Cancel</button>
              <button type="submit" className="px-3 py-1.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-bold">Rename</button>
            </div>
          </form>
        </div>
      )}

      {showComparison && (
        (() => {
          const compResumes = resumes.filter(r => selectedIds.includes(r.id));
          if (compResumes.length !== 2) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
              <div className="w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-950 shadow-soft max-h-[85vh] flex flex-col">
                <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider">Resume Versions Side-by-Side Comparison</h3>
                  <button onClick={() => setShowComparison(false)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-slate-500">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-6 text-xs">
                  {compResumes.map(r => (
                    <div key={r.id} className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white">{r.filename}</h4>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black">{r.version} | Target: {r.target_role}</p>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">ATS Score:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{r.ats_score ? `${r.ats_score}%` : 'Not audited'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">Word Count:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{r.word_count || 0} words</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">Upload Date:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{new Date(r.created_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Document content sample</p>
                        <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-850 h-52 overflow-y-auto font-mono text-[9px] leading-relaxed whitespace-pre-wrap text-slate-650 dark:text-slate-350">
                          {r.text || 'No content.'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()
      )}

      {showFullPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-soft max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-955 dark:text-white uppercase tracking-wider">AI Optimization Compiled Preview</h3>
              <button onClick={() => setShowFullPreview(false)} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 rounded text-slate-500">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-slate-900 dark:text-white">
              {getCompiledResumeText()}
            </div>
            <div className="p-4 border-t border-slate-105 dark:border-slate-850 flex justify-end gap-2">
              <button
                onClick={() => handleCopy(getCompiledResumeText(), 'full')}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Copy Full Text
              </button>
              <button
                onClick={() => setShowFullPreview(false)}
                className="px-4 py-2 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
