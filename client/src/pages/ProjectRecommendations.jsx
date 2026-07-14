import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  BookOpen, 
  Clock, 
  Star, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Award,
  Layers,
  Loader,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { getAnalyses, generateProjectRecommendations, getProjectRecommendationsHistory } from '../services/api';

export default function ProjectRecommendations() {
  const { analysisResults: workspaceAnalysis, fileName: workspaceFileName } = useSettings();

  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  
  // Selection states
  const [activeResumeName, setActiveResumeName] = useState('');
  const [activeJobTitle, setActiveJobTitle] = useState('');
  const [activeMissingSkills, setActiveMissingSkills] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);

  // Recommendations states
  const [projectsList, setProjectsList] = useState([]);
  const [recsHistory, setRecsHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card details open trackers
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    loadAnalysesAndHistory();
  }, []);

  const loadAnalysesAndHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      
      const analysesData = await getAnalyses();
      const recsHistoryData = await getProjectRecommendationsHistory();
      
      setAnalyses(analysesData);
      setRecsHistory(recsHistoryData);

      // Default to active workspace analysis if available
      if (workspaceAnalysis) {
        setActiveAnalysis(workspaceAnalysis);
        setActiveResumeName(workspaceFileName || 'Active_Resume.txt');
        setActiveJobTitle(workspaceAnalysis.job_title || 'Software Engineer');
        
        const missing = workspaceAnalysis.skills?.missing || [];
        setActiveMissingSkills(missing);
        
        // Check if pre-generated recommendations exist in history
        const matchingRec = recsHistoryData.find(h => h.resume_name === workspaceFileName);
        if (matchingRec) {
          setProjectsList(matchingRec.projects);
        }
      } else if (analysesData.length > 0) {
        // Fallback to latest history analysis
        const latest = analysesData[0];
        setSelectedAnalysisId(latest.id);
        handleSelectAnalysis(latest.id, analysesData, recsHistoryData);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sync project recommendations history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectAnalysis = (id, list = analyses, history = recsHistory) => {
    if (!id) return;
    const item = list.find(a => a.id === id);
    if (!item) return;

    setActiveAnalysis(item.results);
    setActiveResumeName(item.resume_filename);
    setActiveJobTitle(item.job_title);
    
    const missing = item.results?.skills?.missing || [];
    setActiveMissingSkills(missing);

    // If pre-generated recommendations exist in history, load it
    const matchingRec = history.find(h => h.resume_name === item.resume_filename);
    if (matchingRec) {
      setProjectsList(matchingRec.projects);
    } else {
      setProjectsList([]);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!activeAnalysis) {
      setError('Please select or perform an analysis scan first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await generateProjectRecommendations(
        activeResumeName,
        activeJobTitle,
        activeMissingSkills
      );
      
      setProjectsList(response.projects);
      
      // Reload history logs
      const updatedHistory = await getProjectRecommendationsHistory();
      setRecsHistory(updatedHistory);
    } catch (err) {
      console.error(err);
      setError('Failed to generate project recommendations catalog.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCardDetails = (projName) => {
    setExpandedCards(prev => ({
      ...prev,
      [projName]: !prev[projName]
    }));
  };

  const getPriorityColor = (prio) => {
    const p = prio.toLowerCase();
    if (p === 'high') return 'text-red-650 bg-red-50 dark:bg-red-950/20';
    if (p === 'medium') return 'text-amber-650 bg-amber-50 dark:bg-amber-955/20';
    return 'text-slate-500 bg-slate-50 dark:bg-slate-850';
  };

  const getDifficultyColor = (diff) => {
    const d = diff.toLowerCase();
    if (d === 'advanced') return 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20';
    if (d === 'intermediate') return 'text-blue-650 bg-blue-50 dark:bg-blue-950/20';
    return 'text-green-650 bg-green-50 dark:bg-green-950/20';
  };

  // Renders a star rating representation for Github Readiness
  const renderReadinessStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-250 dark:text-slate-700'}`} 
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Project Recommendations</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Discover portfolio projects mapped specifically to learn your missing technical skills.</p>
        </div>

        {analyses.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedAnalysisId}
              onChange={(e) => {
                setSelectedAnalysisId(e.target.value);
                handleSelectAnalysis(e.target.value);
              }}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-slate-400 focus:outline-none appearance-none"
            >
              <option value="">Select Analysis Profile...</option>
              {analyses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.resume_filename} ({a.job_title})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target coordinates profile */}
      {activeAnalysis ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-slate-450 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{activeResumeName}</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Missing Skills Count: {activeMissingSkills.length}</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateRecommendations}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold shadow-soft hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              {loading ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {loading ? 'Recommending...' : 'Recommend Learning Projects'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft">
          <FileSearch className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No active analysis loaded</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Please run an analysis scan inside the Dashboard or select an existing evaluation log from the dropdown menu above.
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Recommendations Cards list grid */}
      {projectsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsList.map((proj, idx) => {
            const isExpanded = expandedCards[proj.name] ?? false;
            return (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top segment */}
                <div className="p-5 space-y-4">
                  {/* Badges row */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(proj.priority)}`}>
                      {proj.priority} Priority
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getDifficultyColor(proj.difficulty)}`}>
                      {proj.difficulty}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-950 dark:text-white leading-snug">{proj.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-semibold">
                      {proj.description}
                    </p>
                  </div>

                  {/* Core indicators */}
                  <div className="grid grid-cols-2 gap-4 border-y border-slate-100 dark:border-slate-800/80 py-3 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{proj.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[9px]">GitHub Ready:</span>
                      {renderReadinessStars(proj.github_readiness)}
                    </div>
                  </div>

                  {/* Tech stack Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.technologies.map((tech, tIdx) => (
                      <span key={tIdx} className="bg-slate-50 dark:bg-slate-855 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Collapsible Details segment */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-2 space-y-3.5 text-[11px] leading-relaxed"
                      >
                        {/* Skills Covered */}
                        <div className="space-y-1">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            <span>Skills Covered</span>
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {proj.skills_covered.map((sc, scIdx) => (
                              <span key={scIdx} className="bg-slate-100/60 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {sc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Learning Outcome */}
                        <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Award className="h-3 w-3 text-amber-500" />
                            <span>Learning Outcome</span>
                          </h4>
                          <p className="text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-normal">
                            {proj.learning_outcome}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Toggle details drawer */}
                <div 
                  onClick={() => toggleCardDetails(proj.name)}
                  className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-3.5 flex justify-center items-center gap-1 text-[10px] font-bold text-slate-450 hover:text-slate-850 dark:hover:text-white cursor-pointer select-none transition-colors"
                >
                  <span>{isExpanded ? 'Hide Project Parameters' : 'View Learning Specs'}</span>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft">
          <Code className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No recommendations catalog generated</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Click the "Recommend Learning Projects" button above to dynamically load projects mapping your missing skills gap.
          </p>
        </div>
      )}
    </div>
  );
}
