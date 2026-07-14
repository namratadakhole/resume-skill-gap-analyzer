import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Linkedin, 
  Github, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  Loader,
  CheckCircle,
  AlertCircle,
  Save,
  Camera,
  FileText,
  Award,
  BookOpen,
  MessageSquare,
  Sparkles,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user, updateProfile, loading: authLoading, error: authError, setError } = useAuth();

  // Statistics states
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    highestScore: 0,
    reportsCount: 0,
    chatSessions: 0,
    projectsSuggested: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Profile fields editing states
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [preferredJobRole, setPreferredJobRole] = useState(user?.preferred_job_role || 'Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'Mid Level');
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
  const [education, setEducation] = useState(user?.education || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [certifications, setCertifications] = useState(user?.certifications || '');

  const [successMsg, setSuccessMsg] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch statistics from MongoDB endpoints on load
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        
        // 1. Fetch Analyses count & max score
        const analysesRes = await api.get('/api/analyses');
        const analyses = analysesRes.data || [];
        const totalAnalyses = analyses.length;
        const highestScore = totalAnalyses > 0 ? Math.max(...analyses.map(a => a.ats_score)) : 0;
        
        // Count projects suggested across all analyses
        let projectsSuggested = 0;
        analyses.forEach(a => {
          const res = a.results || {};
          const missingCount = res.skills?.missing?.length || 0;
          projectsSuggested += missingCount > 0 ? Math.min(3, missingCount) : 1;
        });

        // 2. Fetch Reports count
        const reportsRes = await api.get('/api/reports');
        const reports = reportsRes.data || [];
        
        // 3. Fetch chat logs count
        const chatsRes = await api.get('/api/interview_sessions');
        const chats = chatsRes.data || [];

        setStats({
          totalAnalyses,
          highestScore,
          reportsCount: reports.length,
          chatSessions: chats.length,
          projectsSuggested
        });
      } catch (err) {
        console.error('Failed to compute profile statistics:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Synchronize state when user object completes reloading
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phone_number || '');
      setLinkedinUrl(user.linkedin_url || '');
      setGithubUrl(user.github_url || '');
      setPreferredJobRole(user.preferred_job_role || 'Software Engineer');
      setExperienceLevel(user.experience_level || 'Mid Level');
      setProfilePicture(user.profile_picture || '');
      setEducation(user.education || '');
      setSkills(user.skills || '');
      setCertifications(user.certifications || '');
    }
  }, [user]);

  // Handle Photo upload converting to Base64 serialization
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setValidationError('Profile photo must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setProfilePicture(base64String);
      
      // Update immediately
      try {
        setError(null);
        await updateProfile({ profile_picture: base64String });
        setSuccessMsg('Profile picture successfully updated!');
      } catch (err) {
        console.error('Photo upload update failed:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setValidationError('');
    setError(null);

    if (!name.trim()) {
      setValidationError('Profile name cannot be blank.');
      return;
    }

    try {
      await updateProfile({
        name,
        phone_number: phoneNumber,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        preferred_job_role: preferredJobRole,
        experience_level: experienceLevel,
        education,
        skills,
        certifications,
        profile_picture: profilePicture
      });
      setSuccessMsg('Profile settings successfully saved!');
    } catch (err) {
      // Error handled by AuthContext
    }
  };

  const experienceOptions = [
    'Junior (0-2 years)',
    'Mid Level (2-5 years)',
    'Senior (5-8 years)',
    'Lead / Architect (8+ years)'
  ];

  const roleOptions = [
    'Software Engineer',
    'AI Engineer',
    'Machine Learning Engineer',
    'Data Scientist',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Cybersecurity Engineer',
    'Cloud Engineer'
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Configure your professional credentials and inspect audit statistics.</p>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-20 animate-pulse" />
          ))
        ) : (
          <>
            {/* Stat 1 */}
            <div className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-650 shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Audits</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.totalAnalyses}</p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/40 text-green-650 shrink-0">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Max ATS Score</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.highestScore}%</p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 shrink-0">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF Reports</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.reportsCount}</p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-650 shrink-0">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Chats</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.chatSessions}</p>
              </div>
            </div>

            {/* Stat 5 */}
            <div className="rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3.5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-950/40 text-pink-650 shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects Suggested</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stats.projectsSuggested}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Card: Summary & Picture Upload */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft text-center space-y-5">
            <div className="relative mx-auto h-24 w-24">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="h-full w-full rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-3xl font-bold">
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              )}

              {/* Photo Upload Icon trigger */}
              <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-white dark:border-slate-850 cursor-pointer shadow-soft hover:scale-105 transition-transform">
                <Camera className="h-3.5 w-3.5" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">{name || 'Guest User'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-left text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Joined: <strong>{user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Role: <strong>{preferredJobRole}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Full Credentials Editor */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <UserIcon className="h-4.5 w-4.5 text-slate-500" />
              <h4 className="text-sm font-bold text-slate-950 dark:text-white">Profile Coordinates</h4>
            </div>

            {/* Notifications */}
            {validationError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}
            {authError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-3 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {authError}
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 p-3 text-xs font-semibold text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none"
                    disabled={authLoading}
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-350 dark:text-slate-650" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(123) 456-7890"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none"
                    disabled={authLoading}
                  />
                </div>
              </div>

              {/* Preferred Job Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Preferred Job Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={preferredJobRole}
                    onChange={(e) => setPreferredJobRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none appearance-none"
                    disabled={authLoading}
                  >
                    {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Experience Level
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none appearance-none"
                    disabled={authLoading}
                  >
                    {experienceOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none"
                    disabled={authLoading}
                  />
                </div>
              </div>

              {/* GitHub URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  GitHub URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-11 pr-4 py-2.5 text-sm text-slate-800 dark:text-white focus:border-slate-400 focus:outline-none"
                    disabled={authLoading}
                  />
                </div>
              </div>
            </div>

            {/* Extended Professional Coordinates */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-550 dark:text-slate-450">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Biography Coordinates</span>
              </div>

              {/* Education */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Education History
                </label>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. M.S. in Computer Science - Stanford University (2022-2024)&#10;B.S. in Software Engineering - MIT (2018-2022)"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-slate-400 focus:outline-none resize-none font-mono"
                  disabled={authLoading}
                />
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Technical Core Skills
                </label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, JavaScript, React, FastAPI, Docker, Kubernetes, AWS, SQL, NoSQL"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-slate-400 focus:outline-none resize-none font-mono"
                  disabled={authLoading}
                />
              </div>

              {/* Certifications */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Certifications & Credentials
                </label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect&#10;Google Professional Cloud Architect&#10;Certified Kubernetes Administrator (CKA)"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-slate-400 focus:outline-none resize-none font-mono"
                  disabled={authLoading}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={authLoading}
                className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none disabled:bg-slate-350 dark:disabled:bg-slate-800"
              >
                {authLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Saving coordinates...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Coordinates
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
