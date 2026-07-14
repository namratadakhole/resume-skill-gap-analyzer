import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  FileSpreadsheet, 
  Code, 
  History, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  Trash2,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
  RefreshCw as RegenerateIcon,
  CheckCircle,
  Database,
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import { 
  getReportsList, 
  deleteReportLog, 
  trackReportDownload, 
  getAnalyses, 
  downloadReport 
} from '../services/api';

// Recharts for Report analytics
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected report for Preview Modal
  const [previewReport, setPreviewReport] = useState(null);
  const [previewAnalysis, setPreviewAnalysis] = useState(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const reportsData = await getReportsList();
      const analysesData = await getAnalyses();
      
      setReports(reportsData);
      setAnalyses(analysesData);
    } catch (err) {
      console.error(err);
      setError('Failed to load reports history from MongoDB.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this report log?')) return;
    try {
      setError(null);
      await deleteReportLog(id);
      await fetchReportsData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete report log.');
    }
  };

  // Triggers binary PDF stream download and logs the track action
  const handleDownloadPDF = async (report) => {
    try {
      setError(null);
      
      // 1. Find matching analysis results to run regeneration
      const matchingAnalysis = analyses.find(
        a => a.resume_filename === report.resume_name && Math.abs(a.ats_score - report.ats_score) < 0.1
      );
      
      const analysisPayload = matchingAnalysis?.results || {
        ats_score: report.ats_score,
        semantic_score: report.ats_score,
        keyword_score: report.ats_score,
        skills_match_score: report.ats_score,
        formatting_score: 100,
        experience_score: 100,
        skills: { matched: [], missing: [], extra: [] },
        recommendations: []
      };

      const blobData = await downloadReport(analysisPayload, report.resume_name, report.job_title);
      
      // 2. Track download history in MongoDB
      await trackReportDownload(report.id);
      
      // Save file
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Refresh to update count
      await fetchReportsData();
    } catch (err) {
      console.error(err);
      setError('Failed to stream PDF download.');
    }
  };

  // Regeneration: recreate report PDF
  const handleRegenerate = async (report) => {
    try {
      setError(null);
      const matchingAnalysis = analyses.find(
        a => a.resume_filename === report.resume_name && Math.abs(a.ats_score - report.ats_score) < 0.1
      );
      
      if (!matchingAnalysis) {
        setError('No base analysis coordinates found to regenerate report.');
        return;
      }
      
      const blobData = await downloadReport(matchingAnalysis.results, report.resume_name, report.job_title);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Report regenerated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to regenerate report PDF.');
    }
  };

  // Open Preview Drawer
  const handleOpenPreview = (report) => {
    const matchingAnalysis = analyses.find(
      a => a.resume_filename === report.resume_name && Math.abs(a.ats_score - report.ats_score) < 0.1
    );
    setPreviewReport(report);
    setPreviewAnalysis(matchingAnalysis?.results || null);
  };

  // Export JSON
  const handleExportJSON = (report) => {
    const matchingAnalysis = analyses.find(
      a => a.resume_filename === report.resume_name && Math.abs(a.ats_score - report.ats_score) < 0.1
    );
    const dataPayload = matchingAnalysis?.results || { report_metadata: report };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.filename.replace(/\.[^/.]+$/, "")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV of Skills
  const handleExportCSV = (report) => {
    const matchingAnalysis = analyses.find(
      a => a.resume_filename === report.resume_name && Math.abs(a.ats_score - report.ats_score) < 0.1
    );
    
    if (!matchingAnalysis || !matchingAnalysis.results?.skills) {
      alert("No structured skills metadata found for this report to export CSV.");
      return;
    }
    
    const skills = matchingAnalysis.results.skills;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Skill Name,Status,Category\n";
    
    if (skills.categorized_matched) {
      Object.entries(skills.categorized_matched).forEach(([cat, list]) => {
        list.forEach(skill => {
          csvContent += `"${skill}",Matched,"${cat}"\n`;
        });
      });
    }
    
    if (skills.categorized_missing) {
      Object.entries(skills.categorized_missing).forEach(([cat, list]) => {
        list.forEach(skill => {
          csvContent += `"${skill}",Missing,"${cat}"\n`;
        });
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.filename.replace(/\.[^/.]+$/, "")}_skills.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Report Analytics (Recharts visualization)
  const analyticsData = reports.map(r => ({
    name: r.resume_name.length > 15 ? r.resume_name.substring(0, 12) + '...' : r.resume_name,
    Score: Math.round(r.ats_score)
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">PDF Reports History</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Manage saved PDF summaries, inspect print histories, and compile skills logs to spreadsheet exports.</p>
      </div>

      {/* Analytics Graph */}
      {reports.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400">
            <TrendingUp className="h-4.5 w-4.5" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Report ATS Evaluations Analytics</h4>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ 
                    fontSize: '11px', 
                    borderRadius: '12px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e2e8f0'
                  }} 
                />
                <Bar dataKey="Score" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Error Notify */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Reports Table Layout */}
      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing database documents...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-soft">
          <FileText className="h-10 w-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No PDF reports logged</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate and download a PDF report inside the Resume Analysis tab to log metadata files.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Report Name</th>
                  <th className="py-3 px-4">Resume Name</th>
                  <th className="py-3 px-4">Evaluated Date</th>
                  <th className="py-3 px-4">ATS Score</th>
                  <th className="py-3 px-4">Download Count</th>
                  <th className="py-3 px-4">Last Downloaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {reports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                    {/* Report Name */}
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-slate-450 shrink-0" />
                        <span className="truncate max-w-[200px]" title={report.filename}>
                          {report.filename}
                        </span>
                      </div>
                    </td>

                    {/* Resume Name */}
                    <td className="py-4 px-4 font-semibold text-slate-650 dark:text-slate-350">
                      {report.resume_name}
                    </td>

                    {/* Evaluated Date */}
                    <td className="py-4 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      {new Date(report.created_date).toLocaleDateString()}
                    </td>

                    {/* ATS Score */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold text-[10px] ${
                        report.ats_score >= 75 
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700' 
                          : report.ats_score >= 50 
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-700'
                      }`}>
                        {report.ats_score}%
                      </span>
                    </td>

                    {/* Download count */}
                    <td className="py-4 px-4 font-bold text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      {report.download_count} downloads
                    </td>

                    {/* Last downloaded */}
                    <td className="py-4 px-4 font-semibold text-slate-450">
                      {report.last_downloaded 
                        ? new Date(report.last_downloaded).toLocaleDateString() + ' ' + new Date(report.last_downloaded).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Never'
                      }
                    </td>

                    {/* Action panel */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Preview */}
                        <button
                          onClick={() => handleOpenPreview(report)}
                          className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          title="Preview PDF mockup"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        
                        {/* Download */}
                        <button
                          onClick={() => handleDownloadPDF(report)}
                          className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          title="Download PDF File"
                        >
                          <Download className="h-4.5 w-4.5" />
                        </button>

                        {/* Export JSON */}
                        <button
                          onClick={() => handleExportJSON(report)}
                          className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          title="Export JSON"
                        >
                          <Code className="h-4.5 w-4.5" />
                        </button>

                        {/* Export CSV */}
                        <button
                          onClick={() => handleExportCSV(report)}
                          className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          title="Export CSV Skills"
                        >
                          <FileSpreadsheet className="h-4.5 w-4.5" />
                        </button>

                        {/* Regenerate */}
                        <button
                          onClick={() => handleRegenerate(report)}
                          className="p-1 rounded text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                          title="Regenerate PDF"
                        >
                          <RegenerateIcon className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-1 rounded text-slate-450 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-650"
                          title="Delete Report"
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
      )}

      {/* PDF PREVIEW DRAWER */}
      <AnimatePresence>
        {previewReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-slate-50 dark:bg-slate-950 p-6 shadow-soft flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-4 shrink-0">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white truncate pr-4">{previewReport.filename}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Job: {previewReport.job_title} | Score: {previewReport.ats_score}%</p>
                </div>
                <button 
                  onClick={() => { setPreviewReport(null); setPreviewAnalysis(null); }}
                  className="rounded-lg p-1.5 text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Mock PDF Paper Document Layout */}
              <div className="flex-1 overflow-y-auto my-4 bg-white border border-slate-200 dark:border-slate-850 rounded-xl shadow-soft p-8 text-slate-800 max-w-2xl mx-auto w-full font-sans space-y-6">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">ATS EVALUATION PROFILE</h1>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Generated via Resume Intel NLP engine</p>
                  </div>
                  <div className="text-right text-[10px] font-semibold text-slate-500">
                    <p>Date: {new Date(previewReport.created_date).toLocaleDateString()}</p>
                    <p>Document: {previewReport.resume_name}</p>
                  </div>
                </div>

                {/* ATS Score & Job */}
                <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <div className="col-span-2 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Job Position</p>
                    <h3 className="text-sm font-bold text-slate-800">{previewReport.job_title}</h3>
                  </div>
                  <div className="text-center bg-slate-900 text-white rounded-lg p-2.5">
                    <p className="text-[8px] uppercase tracking-wider opacity-60">ATS Score</p>
                    <p className="text-xl font-black">{previewReport.ats_score}%</p>
                  </div>
                </div>

                {/* Score Categories */}
                {previewAnalysis && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold uppercase border-b border-slate-100 pb-1 text-slate-900">Scoring Coordinates Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Semantic Alignment</span>
                          <span className="font-bold">{previewAnalysis.semantic_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Keyword Density</span>
                          <span className="font-bold">{previewAnalysis.keyword_score}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Skills Gap Match</span>
                          <span className="font-bold">{previewAnalysis.skills_match_score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Experience Score</span>
                          <span className="font-bold">{previewAnalysis.experience_score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Skills Gap Details */}
                {previewAnalysis?.skills && (
                  <div className="space-y-3.5 pt-2">
                    <h4 className="text-xs font-bold uppercase border-b border-slate-100 pb-1 text-slate-900">Detected Skill Gap Coordinates</h4>
                    <div className="space-y-2.5 text-[10px] font-semibold">
                      {/* Matched */}
                      <div className="space-y-1.5">
                        <span className="text-green-700 font-bold uppercase tracking-wider text-[8px]">Matched Core Competencies</span>
                        <div className="flex flex-wrap gap-1.5">
                          {previewAnalysis.skills.matched.length > 0 ? (
                            previewAnalysis.skills.matched.map(skill => (
                              <span key={skill} className="bg-green-50 text-green-700 border border-green-100 rounded px-1.5 py-0.5 font-mono">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">No matching skills detected.</span>
                          )}
                        </div>
                      </div>

                      {/* Missing */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-red-700 font-bold uppercase tracking-wider text-[8px]">Missing Gap Core Competencies</span>
                        <div className="flex flex-wrap gap-1.5">
                          {previewAnalysis.skills.missing.length > 0 ? (
                            previewAnalysis.skills.missing.map(skill => (
                              <span key={skill} className="bg-red-50 text-red-700 border border-red-100 rounded px-1.5 py-0.5 font-mono">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-green-600">Perfect match! Zero missing skills gap coordinates.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Footer notice */}
                <div className="border-t border-slate-200 pt-3 text-center text-[8px] font-semibold text-slate-450 uppercase tracking-widest leading-none">
                  CONFIDENTIAL ATS AUDIT SUMMARY REPORT DOCUMENT
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => handleDownloadPDF(previewReport)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={() => { setPreviewReport(null); setPreviewAnalysis(null); }}
                  className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
