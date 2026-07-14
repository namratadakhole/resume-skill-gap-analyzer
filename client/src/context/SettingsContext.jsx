import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

const DEFAULT_SETTINGS = {
  general: {
    theme: 'light', // light, dark, system
    language: 'English',
  },
  analysis: {
    semanticWeight: 30,
    keywordWeight: 20,
    skillsWeight: 30,
    formattingWeight: 10,
    experienceWeight: 10,
  },
  targetRole: 'Software Engineer',
  resumeParser: {
    detectProjects: true,
    detectCertifications: true,
    detectEducation: true,
    detectExperience: true,
    detectSoftSkills: true,
  },
  dashboard: {
    showGauge: true,
    showRadar: true,
    showDonut: true,
    showKPI: true,
    showRoadmap: true,
    showTimeline: true,
  },
  reports: {
    includeCharts: true,
    includeProfile: true,
    includeRecommendations: true,
    includeRoadmap: true,
    includeMissingSkills: true,
    includeMatchedSkills: true,
  },
  history: {
    saveAnalyses: true,
    maxHistory: 25,
  },
  aiCoach: {
    enable: true,
    responseStyle: 'Professional', // Professional, Detailed, Short, Interview Focused, Career Mentor
  },
  notifications: {
    analysisCompleted: true,
    downloadFinished: true,
    showToast: true,
  },
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('resume_analyzer_settings');
      const settingsObj = stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
      // Load saved theme preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        settingsObj.general.theme = savedTheme;
      }
      return settingsObj;
    } catch (e) {
      console.error('Failed to load settings:', e);
      return DEFAULT_SETTINGS;
    }
  });

  // Apply settings to localStorage on change
  useEffect(() => {
    localStorage.setItem('resume_analyzer_settings', JSON.stringify(settings));
  }, [settings]);

  // Theme styling implementation
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    
    let resolvedTheme = settings.general.theme;
    if (resolvedTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.add(resolvedTheme);
    localStorage.setItem('theme', settings.general.theme);
  }, [settings.general.theme]);

  const updateSettings = (section, updates) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates,
      },
    }));
  };

  const updateDirectSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const [analysisResults, setAnalysisResults] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescText, setJobDescText] = useState('');
  const [fileName, setFileName] = useState('');

  const [savedReports, setSavedReports] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setSavedReports([]);
        return;
      }
      try {
        const response = await api.get('/api/analyses');
        const mapped = response.data.map(a => ({
          id: a.id,
          timestamp: a.created_date,
          fileName: a.resume_filename || 'Parsed_Resume.txt',
          jobTitle: a.job_title || 'Software Professional',
          atsScore: a.ats_score,
          semanticScore: a.semantic_score,
          keywordScore: a.keyword_score,
          skillsMatched: a.results?.skills?.matched?.length || 0,
          skillsMissing: a.results?.skills?.missing?.length || 0,
          fullResults: a.results
        }));
        setSavedReports(mapped);
      } catch (err) {
        console.error('Failed to fetch analyses history:', err);
      }
    };

    fetchHistory();
  }, [analysisResults]);

  const saveNewReport = (reportData, fName, jTitle) => {
    // Backend automatically saves the report inside the /api/analyze route
  };

  const deleteReport = async (id) => {
    try {
      await api.delete(`/api/analyses/${id}`);
      setSavedReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const clearReports = () => {
    setSavedReports([]);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateDirectSetting,
        resetSettings,
        analysisResults,
        setAnalysisResults,
        resumeText,
        setResumeText,
        jobDescText,
        setJobDescText,
        fileName,
        setFileName,
        savedReports,
        saveNewReport,
        deleteReport,
        clearReports
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
