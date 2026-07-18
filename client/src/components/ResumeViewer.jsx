import React from 'react';
import { User, Mail, Phone, GraduationCap, Briefcase, Cpu, FileText, Award, FolderGit } from 'lucide-react';

export default function ResumeViewer({ resumeText, fileName, parserResults, matchedSkills = [] }) {
  // Safe extraction of parsed details from backend parserResults
  const name = parserResults?.candidate_name || 'Not detected';
  const email = parserResults?.email || 'Not detected';
  const phone = parserResults?.phone || 'Not detected';
  const education = Array.isArray(parserResults?.education) ? parserResults.education : [];
  const experience = Array.isArray(parserResults?.experience) ? parserResults.experience : [];
  const certifications = Array.isArray(parserResults?.certifications) ? parserResults.certifications : [];
  const projects = Array.isArray(parserResults?.projects) ? parserResults.projects : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* SaaS Profile Metadata Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6 transition-colors duration-200">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Candidate Profile Card</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mt-0.5">Parsed via Resume Intelligence</p>
        </div>

        <div className="space-y-4">
          {/* Candidate Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50">
              <User className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Candidate Name</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{name}</p>
            </div>
          </div>

          {/* Email & Phone grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 truncate">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50">
                <Phone className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-300">{phone}</p>
              </div>
            </div>
          </div>

          {/* Experience Highlights */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50 shrink-0">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Experience highlights</p>
              {experience.length > 0 ? (
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {experience.map((line, idx) => (
                    <li key={idx} className="truncate max-w-[280px]" title={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">None detected.</p>
              )}
            </div>
          </div>

          {/* Education Details */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50 shrink-0">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Education Details</p>
              {education.length > 0 ? (
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {education.map((line, idx) => (
                    <li key={idx} className="truncate max-w-[280px]" title={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">None detected.</p>
              )}
            </div>
          </div>

          {/* Projects details */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50 shrink-0">
              <FolderGit className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Projects</p>
              {projects.length > 0 ? (
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {projects.map((line, idx) => (
                    <li key={idx} className="truncate max-w-[280px]" title={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">None detected.</p>
              )}
            </div>
          </div>

          {/* Certifications highlights */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50 shrink-0">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1 overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Certifications</p>
              {certifications.length > 0 ? (
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  {certifications.map((line, idx) => (
                    <li key={idx} className="truncate max-w-[280px]" title={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">None detected.</p>
              )}
            </div>
          </div>

          {/* Primary Core Skills */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/50 shrink-0">
              <Cpu className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Primary Core Skills</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {matchedSkills.slice(0, 8).map((skill, idx) => (
                  <span key={idx} className="rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-650 dark:text-slate-300">
                    {skill}
                  </span>
                ))}
                {matchedSkills.length > 8 && (
                  <span className="rounded bg-slate-100 dark:bg-slate-850 px-2 py-0.5 text-[10px] font-bold text-slate-550 dark:text-slate-400">
                    +{matchedSkills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Text Viewer */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-900 dark:bg-slate-950 p-4 flex flex-col h-full min-h-[350px] lg:min-h-0 border-dashed">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3 text-slate-400">
          <FileText className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wider uppercase">
            {fileName || 'Extracted Code View'}
          </span>
        </div>
        <div className="flex-grow overflow-y-auto text-xs text-slate-300 dark:text-slate-400 font-mono leading-relaxed pr-2 whitespace-pre-wrap">
          {resumeText}
        </div>
      </div>
    </div>
  );
}
