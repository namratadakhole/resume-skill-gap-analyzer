import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Briefcase, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { uploadResume, analyzeResume } from '../services/api';
import { useSettings } from '../context/SettingsContext';

// Components
import UploadCard from '../components/UploadCard';
import ATSGauge from '../components/ATSGauge';
import KPICard from '../components/KPICard';
import SkillBadge from '../components/SkillBadge';
import SkillChart from '../components/SkillChart';
import RadarChart from '../components/RadarChart';
import RecommendationCard from '../components/RecommendationCard';
import PDFDownloadButton from '../components/PDFDownloadButton';
import ResumeViewer from '../components/ResumeViewer';
import AIResumeCoach from '../components/AIResumeCoach';
import ResumeImprovementChecklist from '../components/ResumeImprovementChecklist';

export default function Dashboard() {
  const { 
    settings,
    analysisResults: results,
    setAnalysisResults: setResults,
    resumeText,
    setResumeText,
    jobDescText,
    setJobDescText,
    fileName,
    setFileName,
    saveNewReport
  } = useSettings();

  // UI States
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);

  // File metadata states
  const [fileSize, setFileSize] = useState(null);
  const [fileType, setFileType] = useState('');
  const [pagesCount, setPagesCount] = useState(1);
  const [readingTime, setReadingTime] = useState('');

  const loadingSteps = [
    "Parsing Resume",
    "Extracting Skills",
    "Running NLP Analysis",
    "Calculating ATS Score",
    "Generating Recommendations",
    "Preparing Report"
  ];

  // Helper functions for metadata extraction
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFriendlyFileType = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    const mappings = {
      pdf: 'PDF Document',
      docx: 'Word Document',
      doc: 'Word Document (Legacy)',
      txt: 'Plain Text File',
      png: 'PNG Image',
      jpg: 'JPEG Image',
      jpeg: 'JPEG Image',
      gif: 'GIF Image'
    };
    return mappings[ext] || 'Document';
  };

  const estimatePages = (text) => {
    if (!text) return 1;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 500));
  };

  const getReadingTime = (text) => {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  };

  // Reset page
  const handleClear = () => {
    setResumeText('');
    setJobDescText('');
    setFileName('');
    setResults(null);
    setError(null);
    setFileSize(null);
    setFileType('');
    setPagesCount(1);
    setReadingTime('');
  };

  // Upload file handler
  const handleFileUpload = async (file) => {
    if (fileName) {
      const confirmReplace = window.confirm("Are you sure you want to replace the current resume?");
      if (!confirmReplace) return;
    }
    
    setUploading(true);
    setError(null);
    try {
      setFileName(file.name);
      setFileSize(formatFileSize(file.size));
      setFileType(getFriendlyFileType(file.name));

      const data = await uploadResume(file);
      setResumeText(data.text);
      setPagesCount(estimatePages(data.text));
      setReadingTime(getReadingTime(data.text));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to extract text from file.');
      setFileName('');
      setFileSize(null);
      setFileType('');
    } finally {
      setUploading(false);
    }
  };

  // Analysis executor
  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setError('Please upload a resume or paste your resume text first.');
      return;
    }
    if (!jobDescText.trim()) {
      setError('Please paste a target job description to audit against.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setLoadingStep(0);

    const apiWeights = {
      semantic: settings.analysis.semanticWeight / 100,
      keyword: settings.analysis.keywordWeight / 100,
      skill_coverage: settings.analysis.skillsWeight / 100,
      formatting: settings.analysis.formattingWeight / 100,
      experience: settings.analysis.experienceWeight / 100
    };

    // Start API request in parallel with loading step animation
    const apiPromise = analyzeResume(resumeText, jobDescText, apiWeights);

    let step = 0;
    const stepInterval = setInterval(() => {
      step += 1;
      if (step < loadingSteps.length) {
        setLoadingStep(step);
      }
    }, 400);

    try {
      const data = await apiPromise;
      clearInterval(stepInterval);
      setLoadingStep(loadingSteps.length - 1);

      console.log('[DASHBOARD] Received API analysis data:', data);
      const analysisObj = data?.results || data;
      console.log('[DASHBOARD] Extracted analysisObj for state:', analysisObj);

      setResults(analysisObj);
      const firstLine = jobDescText.split('\n')[0] || '';
      const jobTitle = firstLine.replace('Position:', '').replace('Role:', '').replace('Company:', '').trim() || 'Software Developer';
      saveNewReport(analysisObj, fileName, jobTitle);
    } catch (err) {
      clearInterval(stepInterval);
      console.error('[DASHBOARD] Analysis error:', err);
      setError(err.response?.data?.detail || err.message || 'Analysis engine execution failed.');
    } finally {
      clearInterval(stepInterval);
      setAnalyzing(false);
    }
  };

  // Process data for charts
  const getRadarData = () => {
    if (!results || !results.skills) return [];
    const matched = results.skills.categorized_matched || {};
    const missing = results.skills.categorized_missing || {};
    
    // Union categories
    const categories = Array.from(new Set([...Object.keys(matched), ...Object.keys(missing)]));
    
    return categories.map(cat => {
      const matchedCount = matched[cat]?.length || 0;
      const missingCount = missing[cat]?.length || 0;
      const total = matchedCount + missingCount;
      const pct = total > 0 ? (matchedCount / total) * 100 : 0;
      return {
        subject: cat,
        percentage: Math.round(pct),
      };
    });
  };

  // Get Resume Strength Rating string
  const getResumeStrengthRating = (score) => {
    if (score >= 75) return 'Professional';
    if (score >= 50) return 'Competent';
    return 'Revisions Required';
  };

  // Calculate learning priority pipeline
  const getLearningTimeline = () => {
    if (!results || !results.skills?.missing) return [];
    
    const missing = results.skills.missing;
    if (missing.length === 0) return [];

    // Distribute missing skills into 4 weeks
    const timeline = [
      { week: 'Week 1', title: 'Core Competency Alignments', skills: [] },
      { week: 'Week 2', title: 'Secondary Stack Integrations', skills: [] },
      { week: 'Week 3', title: 'DevOps & Pipeline Audits', skills: [] },
      { week: 'Week 4', title: 'Portfolio Projects & Review', skills: [] },
    ];

    missing.forEach((skill, index) => {
      const targetWeek = index % 4;
      timeline[targetWeek].skills.push(skill);
    });

    return timeline.filter(t => t.skills.length > 0);
  };

  // Compute dynamic grid classes for visible charts
  const activeChartsCount = 
    (settings.dashboard.showGauge ? 2 : 0) + 
    (settings.dashboard.showDonut ? 1 : 0) + 
    (settings.dashboard.showRadar ? 1 : 0);

  const gridColsClass = 
    activeChartsCount === 4 ? 'md:grid-cols-4' :
    activeChartsCount === 3 ? 'md:grid-cols-3' :
    activeChartsCount === 2 ? 'md:grid-cols-2' :
    'md:grid-cols-1';

  return (
    <div className="space-y-8">
      {/* Production Hero Section */}
      <div className="text-center py-6 px-4 max-w-3xl mx-auto space-y-3.5 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Resume Skill Gap Analyzer
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Analyze your resume against any job description using AI-powered ATS analysis, skill gap detection, resume optimization, and interview preparation.
        </p>
      </div>

      {/* Input layout when no results are present */}
      {!results && !analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Resume Upload Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Upload Resume</h3>
            </div>

            <AnimatePresence mode="wait">
              {fileName && !uploading && resumeText ? (
                <motion.div
                  key="success-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-green-600 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 p-4 rounded-xl">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold">✓ Resume Uploaded Successfully</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">File Name</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{fileName}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Detected File Type</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{fileType || 'Document'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">File Size</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{fileSize || '0 KB'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Pages</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{pagesCount} Page{pagesCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="col-span-2 space-y-1 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Estimated Reading Time</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{readingTime || '1 min read'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.docx,.txt,.png,.jpg,.jpeg';
                        input.onchange = (e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        };
                        input.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors focus:outline-none"
                    >
                      Replace Resume
                    </button>
                    <button
                      onClick={() => {
                        setFileName('');
                        setResumeText('');
                        setFileSize(null);
                        setFileType('');
                        setPagesCount(1);
                        setReadingTime('');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 text-red-650 dark:text-red-400 py-2.5 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors focus:outline-none"
                    >
                      Remove Resume
                    </button>
                  </div>
                  
                  <button
                    onClick={handleAnalyze}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Analyze Resume
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <UploadCard 
                    onFileUpload={handleFileUpload} 
                    fileName={fileName} 
                    isLoading={uploading} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Resume Raw Text
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={9}
                placeholder="Extracted file text content will render here. Or, you can type/paste details manually..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:border-slate-400 focus:outline-none placeholder:text-slate-400 font-mono text-xs"
              />
            </div>
          </div>

          {/* Job description input */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                <Briefcase className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Paste Job Description</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Target Job Description
              </label>
              <textarea
                value={jobDescText}
                onChange={(e) => setJobDescText(e.target.value)}
                rows={17}
                placeholder="Paste the target hiring post, technical specifications, or preferred competencies..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Steps Loader Animation */}
      {analyzing && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-soft max-w-md mx-auto space-y-6 animate-pulse">
          <div className="text-center space-y-2">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">Audit In Progress</h3>
            <p className="text-xs text-slate-500">We are auditing your resume profile coordinates against the JD parameters.</p>
          </div>

          <div className="space-y-3">
            {loadingSteps.map((step, idx) => {
              const isActive = idx === loadingStep;
              const isCompleted = idx < loadingStep;
              
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-slate-500' : 'text-slate-300'
                  }`}>
                    {step}
                  </span>
                  <div>
                    {isCompleted ? (
                      <CheckCircle className="h-4.5 w-4.5 text-green-600" />
                    ) : isActive ? (
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-slate-50 border border-slate-100" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Form Actions when no results are shown */}
      {!results && !analyzing && !fileName && (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-4 text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <Play className="h-4 w-4 fill-current" />
            Initiate Semantic Match Audit
          </button>
        </div>
      )}

      {/* Upgraded SaaS Dashboard Results View */}
      {results && !analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Top Row: 5 KPI cards (conditionally visible) */}
          {settings.dashboard.showKPI && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <KPICard 
                title="Overall ATS" 
                value={`${results.ats_score}%`} 
                subtitle="Weighted parser rating"
                progressValue={results.ats_score}
                progressColor="bg-blue-600"
              />
              <KPICard 
                title="Semantic Match" 
                value={`${results.semantic_score}%`} 
                subtitle="Sentence Transformer similarity"
                progressValue={results.semantic_score}
                progressColor="bg-slate-900 dark:bg-slate-100"
              />
              <KPICard 
                title="Keyword Match" 
                value={`${results.keyword_score}%`} 
                subtitle="TF-IDF Cosine Similarity"
                progressValue={results.keyword_score}
                progressColor="bg-blue-900"
              />
              <KPICard 
                title="Skill Coverage" 
                value={`${results.skills_match_score}%`} 
                subtitle="Matched required skills rate"
                progressValue={results.skills_match_score}
                progressColor="bg-emerald-600"
              />
              <KPICard 
                title="Formatting" 
                value={`${results.formatting_score}%`} 
                subtitle="Layout compliance rating"
                progressValue={results.formatting_score}
                progressColor={results.formatting_score >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}
              />
            </div>
          )}

          {/* Grids containing Analytics charts and Interactive panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Visualizations & Reviewers */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recharts Analytics Card (conditionally visible based on charts) */}
              {activeChartsCount > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    ATS Analytics
                  </h4>

                  <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
                    {/* Gauge 1 & 2 (conditionally visible) */}
                    {settings.dashboard.showGauge && (
                      <>
                        <div className="flex justify-center border-r border-slate-100 dark:border-slate-800 pr-2">
                          <ATSGauge score={results.ats_score} tier={results.tier} />
                        </div>
                        <div className="flex justify-center border-r border-slate-100 dark:border-slate-800 pr-2">
                          <ATSGauge score={results.semantic_score} tier="Semantic Fit" />
                        </div>
                      </>
                    )}

                    {/* Donut Match proportions (conditionally visible) */}
                    {settings.dashboard.showDonut && (
                      <div className="flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 pr-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Skill Proportions</span>
                        <SkillChart 
                          matchedCount={results.skills?.matched?.length || 0} 
                          missingCount={results.skills?.missing?.length || 0} 
                        />
                      </div>
                    )}
                    
                    {/* Category Radar (conditionally visible) */}
                    {settings.dashboard.showRadar && (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Category Alignment</span>
                        <RadarChart data={getRadarData()} />
                      </div>
                    )}
                  </div>

                  {/* Progress bars splits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>ATS Compatibility</span>
                        <span>{results.ats_score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${results.ats_score}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Keyword Match</span>
                        <span>{results.skills_match_score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-slate-900 dark:bg-slate-100 rounded-full" style={{ width: `${results.skills_match_score}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Resume Formatting</span>
                        <span>{results.formatting_score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${results.formatting_score}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>Experience Match</span>
                        <span>{results.experience_score}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-900 rounded-full" style={{ width: `${results.experience_score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume text metadata viewer */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Resume Previewer
                </h4>
                <ResumeViewer 
                  resumeText={resumeText} 
                  fileName={fileName} 
                  parserResults={results.parser_results}
                  matchedSkills={results.skills?.matched || []} 
                />
              </div>

              {/* Skills Split Visualization Badges */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                  Skills Split Visualization
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Technical Category list */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical Skills</h5>
                    
                    {results.skills?.categorized_matched && Object.keys(results.skills.categorized_matched).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(results.skills.categorized_matched).map(([cat, skills]) => (
                          <div key={cat} className="space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500">{cat}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {skills.map(s => <SkillBadge key={s} name={s} type="matched" />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No matched technical skills identified.</p>
                    )}
                  </div>

                  {/* Soft Skills & Gaps list */}
                  <div className="space-y-6 sm:border-l sm:border-slate-100 sm:border-slate-800 sm:pl-8">
                    {/* Missing requirements outlined in red */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Missing Gaps (Red Outlined)</h5>
                      {results.skills?.categorized_missing && Object.keys(results.skills.categorized_missing).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(results.skills.categorized_missing).map(([cat, skills]) => (
                            <div key={cat} className="space-y-1.5">
                              <p className="text-xs font-semibold text-slate-500">{cat}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map(s => <SkillBadge key={s} name={s} type="missing" />)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-green-600 font-semibold">Perfect matching credentials. No missing gaps!</p>
                      )}
                    </div>

                    {/* Additional elements */}
                    {results.skills?.extra && results.skills.extra.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extra Credentials</h5>
                        <div className="flex flex-wrap gap-1.5">
                          {results.skills.extra.map(s => <SkillBadge key={s} name={s} type="extra" />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: AI Assistant & Pathways */}
            <div className="space-y-8">
              {/* Resume Improvement Checklist */}
              <ResumeImprovementChecklist 
                results={results} 
                resumeName={fileName} 
                resumeText={resumeText} 
              />

              {/* AI Resume Coach */}
              {settings.aiCoach.enable && <AIResumeCoach results={results} resumeName={fileName} />}

              {/* Action Recommendations expandable list */}
              {settings.dashboard.showRoadmap && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    AI Recommendations
                  </h4>
                  <div className="space-y-3">
                    {results.recommendations && results.recommendations.length > 0 ? (
                      results.recommendations.map((rec, idx) => (
                        <RecommendationCard 
                          key={idx}
                          index={idx + 1}
                          skill={rec.skill}
                          action={rec.action}
                          type={rec.type}
                        />
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No specific action recommendations mapped.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Learning Roadmap Timeline Week 1 to 4 */}
              {settings.dashboard.showTimeline && getLearningTimeline().length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                    Learning Roadmap Timeline
                  </h4>

                  <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-4">
                    {getLearningTimeline().map((stage, idx) => (
                      <div key={idx} className="relative pl-6">
                        {/* Bullet Circle */}
                        <span className="absolute -left-[11px] top-1.5 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-[10px] font-bold text-white dark:text-slate-900 ring-8 ring-white dark:ring-slate-900">
                          {idx + 1}
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="text-sm font-semibold text-slate-950 dark:text-white">{stage.week}</h5>
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stage.title}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {stage.skills.map((s, itemIdx) => (
                              <span key={itemIdx} className="inline-flex items-center gap-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-350">
                                {s}
                                <ArrowRight className="h-2 w-2 text-slate-400" />
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Document Exporter */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">Export Report Document</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download a compiled PDF audit file outlining matching results.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <PDFDownloadButton 
                    analysis={results}
                    resumeName={fileName}
                    jobTitle={jobDescText.split('\n')[0].replace('Position:', '').replace('Role:', '').trim() || 'Software Developer'}
                  />
                  <button
                    onClick={handleClear}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2.5 text-xs font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                  >
                    Upload Another Resume
                  </button>
                </div>
              </div>

              {/* Return reset button */}
              <button
                onClick={handleClear}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-900 py-2 transition-colors focus:outline-none"
              >
                Perform Another Analysis
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
