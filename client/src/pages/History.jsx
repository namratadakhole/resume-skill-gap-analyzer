import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  FolderOpen, 
  Download, 
  Scale, 
  RefreshCw, 
  BarChart3, 
  Calendar,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  LineChart
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { 
  getAnalyses, 
  deleteAnalysis, 
  duplicateAnalysis, 
  downloadReport 
} from '../services/api';

// Recharts components
import { 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip
} from 'recharts';

export default function History({ setActivePage }) {
  const { setAnalysisResults, setResumeText, setFileName } = useSettings();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [scoreFilter, setScoreFilter] = useState('All Scores');

  // Sorting State
  const [sortField, setSortField] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Comparison State
  const [selectedIds, setSelectedIds] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchAnalysesList();
  }, []);

  const fetchAnalysesList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyses();
      setAnalyses(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analysis logs from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAnalysis = (item) => {
    // Synchronize workspace contexts
    setAnalysisResults(item.results);
    setResumeText(item.results.parser_results?.resume_text || '');
    setFileName(item.resume_filename);
    
    // Switch page
    if (setActivePage) {
      setActivePage('Resume Analysis');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      setError(null);
      await duplicateAnalysis(id);
      await fetchAnalysesList();
    } catch (err) {
      console.error(err);
      setError('Duplicate analysis failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this analysis record?')) return;
    try {
      setError(null);
      await deleteAnalysis(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      await fetchAnalysesList();
    } catch (err) {
      console.error(err);
      setError('Failed to delete analysis record.');
    }
  };

  const handleDownloadPDF = async (item) => {
    try {
      const blobData = await downloadReport(item.results, item.resume_filename, item.job_title);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${item.resume_filename}_ATS_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setError('Failed to download PDF report.');
    }
  };

  const handleSelectReport = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 2) {
          return [prev[1], id];
        }
        return [...prev, id];
      }
    });
  };

  // Toggle sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // 1. Search and filter list
  const processedAnalyses = analyses.filter(item => {
    const filenameMatch = item.resume_filename.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = item.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check filters
    const matchesSearch = filenameMatch || roleMatch;
    
    const matchesRole = roleFilter === 'All Roles' || item.job_title === roleFilter;
    
    let matchesScore = true;
    if (scoreFilter === 'High Match (>= 75%)') {
      matchesScore = item.ats_score >= 75;
    } else if (scoreFilter === 'Medium Match (50% - 74%)') {
      matchesScore = item.ats_score >= 50 && item.ats_score < 75;
    } else if (scoreFilter === 'Low Match (< 50%)') {
      matchesScore = item.ats_score < 50;
    }
    
    return matchesSearch && matchesRole && matchesScore;
  });

  // 2. Sort list
  const sortedAnalyses = [...processedAnalyses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'created_date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 3. Paginate list
  const totalPages = Math.ceil(sortedAnalyses.length / itemsPerPage);
  const paginatedAnalyses = sortedAnalyses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Extract unique roles for dropdown filter
  const uniqueRoles = Array.from(new Set(analyses.map(a => a.job_title)));

  // Prepare chart coordinates (chronological order)
  const chartData = [...analyses]
    .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime())
    .map(a => ({
      date: new Date(a.created_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      ATS: Math.round(a.ats_score)
    }));

  const comparedItems = analyses.filter(a => selectedIds.includes(a.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Analysis History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review previous NLP matching evaluations, track score progressions, and clone or compare profiles.</p>
      </div>

      {/* Analytics Chart Widget */}
      {analyses.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400">
            <LineChart className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">ATS Progression Trend</h4>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorATS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ 
                    fontSize: '11px', 
                    borderRadius: '12px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0'
                  }} 
                />
                <Area type="monotone" dataKey="ATS" stroke="#1e293b" strokeWidth={2} fillOpacity={1} fill="url(#colorATS)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters Interface Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-soft">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-450" />
          <input 
            type="text"
            placeholder="Search by resume filename or role..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:border-slate-400 focus:outline-none"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-slate-400 focus:outline-none appearance-none"
        >
          <option value="All Roles">All Roles</option>
          {uniqueRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>

        {/* Score Filter */}
        <select
          value={scoreFilter}
          onChange={(e) => { setScoreFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-slate-400 focus:outline-none appearance-none"
        >
          <option value="All Scores">All Scores</option>
          <option value="High Match (>= 75%)">High Match (&gt;= 75%)</option>
          <option value="Medium Match (50% - 74%)">Medium Match (50% - 74%)</option>
          <option value="Low Match (< 50%)">Low Match (&lt; 50%)</option>
        </select>
      </div>

      {/* Comparison Actions */}
      {selectedIds.length > 0 && (
        <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 shadow-soft">
          <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
            Comparison Drawer: Selected <strong>{selectedIds.length}</strong> / 2 reports.
          </span>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowComparison(true)}
              disabled={selectedIds.length < 2}
              className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-bold disabled:opacity-40"
            >
              Compare Side-by-Side
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs font-semibold text-slate-450 hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing workspace logs...</span>
        </div>
      ) : paginatedAnalyses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft">
          <HistoryIcon className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No matching evaluations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Perform an NLP matching scan on the Dashboard to populate audit history.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Select</th>
                    <th 
                      onClick={() => handleSort('resume_filename')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Resume Name {sortField === 'resume_filename' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('job_title')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Target Role {sortField === 'job_title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('ats_score')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ATS Score {sortField === 'ats_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('semantic_score')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Semantic Match {sortField === 'semantic_score' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => handleSort('created_date')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Date {sortField === 'created_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedAnalyses.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectReport(item.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-slate-400 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Name */}
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-450 shrink-0" />
                          <span className="truncate max-w-[180px]" title={item.resume_filename}>
                            {item.resume_filename}
                          </span>
                        </div>
                      </td>

                      {/* Job Title */}
                      <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-350">
                        {item.job_title}
                      </td>

                      {/* ATS score badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] ${
                          item.ats_score >= 75 
                            ? 'bg-green-50 dark:bg-green-950/20 text-green-700' 
                            : item.ats_score >= 50 
                            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                            : 'bg-red-50 dark:bg-red-950/20 text-red-700'
                        }`}>
                          {item.ats_score}%
                        </span>
                      </td>

                      {/* Semantic score badge */}
                      <td className="py-4 px-4 font-semibold text-slate-500 dark:text-slate-400">
                        {item.semantic_score}% match
                      </td>

                      {/* Created date */}
                      <td className="py-4 px-4 text-slate-450 font-semibold">
                        {new Date(item.created_date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenAnalysis(item)}
                            className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            title="Open Analysis Workspace"
                          >
                            <FolderOpen className="h-4.5 w-4.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDuplicate(item.id)}
                            className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            title="Duplicate Analysis"
                          >
                            <Copy className="h-4.5 w-4.5" />
                          </button>

                          <button
                            onClick={() => handleDownloadPDF(item)}
                            className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                            title="Download PDF"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded text-slate-450 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-450 font-semibold">
                Page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARISON DIALOG MODAL */}
      <AnimatePresence>
        {showComparison && comparedItems.length === 2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-soft space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">Side-by-Side Analysis Comparison</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Auditing matching evaluation logs coordinates</p>
                </div>
                <button 
                  onClick={() => setShowComparison(false)}
                  className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Comparison Grid */}
              <div className="grid grid-cols-3 gap-6 text-xs border border-slate-100 dark:border-slate-800/80 rounded-xl bg-slate-50/20 dark:bg-slate-900/10 p-5">
                {/* Labels */}
                <div className="space-y-6 font-bold text-slate-400 uppercase tracking-wider text-[10px] pt-1">
                  <div className="h-10 flex items-center">Resume Name</div>
                  <div className="h-8 flex items-center">Job Title</div>
                  <div className="h-12 flex items-center">ATS Score</div>
                  <div className="h-8 flex items-center">Semantic Score</div>
                  <div className="h-8 flex items-center">Keyword Match</div>
                  <div className="h-8 flex items-center">Skills Score</div>
                  <div className="h-8 flex items-center">Experience Score</div>
                  <div className="h-8 flex items-center">Evaluation Date</div>
                </div>

                {/* Report 1 */}
                <div className="space-y-6 text-slate-700 dark:text-slate-350">
                  <div className="h-10 font-bold text-slate-950 dark:text-white truncate max-w-[220px] flex items-center">
                    {comparedItems[0].resume_filename}
                  </div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[0].job_title}</div>
                  <div className="h-12 flex items-center">
                    <div className="space-y-1 w-full">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{comparedItems[0].ats_score}%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 dark:bg-slate-100 h-full rounded-full" style={{ width: `${comparedItems[0].ats_score}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[0].semantic_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[0].keyword_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[0].skills_match_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[0].experience_score}%</div>
                  <div className="h-8 flex items-center font-semibold">
                    {new Date(comparedItems[0].created_date).toLocaleDateString()}
                  </div>
                </div>

                {/* Report 2 */}
                <div className="space-y-6 text-slate-700 dark:text-slate-350">
                  <div className="h-10 font-bold text-slate-950 dark:text-white truncate max-w-[220px] flex items-center">
                    {comparedItems[1].resume_filename}
                  </div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[1].job_title}</div>
                  <div className="h-12 flex items-center">
                    <div className="space-y-1 w-full">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{comparedItems[1].ats_score}%</span>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-slate-900 dark:bg-slate-100 h-full rounded-full" style={{ width: `${comparedItems[1].ats_score}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[1].semantic_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[1].keyword_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[1].skills_match_score}%</div>
                  <div className="h-8 flex items-center font-semibold">{comparedItems[1].experience_score}%</div>
                  <div className="h-8 flex items-center font-semibold">
                    {new Date(comparedItems[1].created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowComparison(false)}
                  className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold"
                >
                  Close Comparison
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
