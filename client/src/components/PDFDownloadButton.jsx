import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { downloadReport } from '../services/api';
import { getCleanFileName } from '../utils/helpers';

export default function PDFDownloadButton({ analysis, resumeName, jobTitle }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const cleanName = getCleanFileName(resumeName) || 'candidate';
      const cleanTitle = jobTitle || 'target_role';
      
      const blob = await downloadReport(analysis, cleanName, cleanTitle);
      
      // Create object URL and download file
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cleanName}_ATS_Evaluation.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-4 py-3 text-sm font-semibold text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none disabled:bg-slate-300 dark:disabled:bg-slate-800"
      >
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download PDF Report
          </>
        )}
      </button>
      {error && <p className="text-center text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
