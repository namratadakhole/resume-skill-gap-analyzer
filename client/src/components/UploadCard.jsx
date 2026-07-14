import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, Loader } from 'lucide-react';

export default function UploadCard({ onFileUpload, fileName, isLoading, error }) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (!fileName && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fileName]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        isDragActive
          ? 'border-slate-900 bg-slate-50/50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-600 mb-4 border border-slate-100">
        {isLoading ? (
          <Loader className="h-6 w-6 animate-spin text-slate-800" />
        ) : fileName ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : (
          <UploadCloud className="h-6 w-6" />
        )}
      </div>

      <div className="space-y-1 mb-6">
        <p className="text-sm font-semibold text-slate-950">
          {isLoading && fileName && fileName.match(/\.(png|jpe?g)$/i)
            ? 'Extracting text from image...'
            : fileName
              ? `File: ${fileName}`
              : 'Upload your resume'}
        </p>
        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
          {isLoading && fileName && fileName.match(/\.(png|jpe?g)$/i)
            ? 'Running AI text extraction coordinates...'
            : 'Drag and drop your file here, or click to browse. Supports PDF, DOCX, TXT, PNG, JPG, JPEG.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onButtonClick}
        disabled={isLoading}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 hover:text-slate-950 transition-colors shadow-sm focus:outline-none"
      >
        {fileName ? 'Replace File' : 'Browse Files'}
      </button>

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
