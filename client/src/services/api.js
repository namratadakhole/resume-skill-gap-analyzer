import axios from 'axios';

// Create Axios Client Instance
// Vite config proxies '/api' and '/auth' to FastAPI http://localhost:8000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor to dynamically inject authorization header if token is cached
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Resume Management REST Actions ---

export const uploadResumeFile = async (file, targetRole = 'Not set') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_role', targetRole);
  
  const response = await api.post('/api/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getResumes = async () => {
  const response = await api.get('/api/resumes');
  return response.data;
};

export const renameResume = async (id, newFilename) => {
  const response = await api.put(`/api/resumes/${id}/rename`, {
    new_filename: newFilename
  });
  return response.data;
};

export const deleteResume = async (id) => {
  const response = await api.delete(`/api/resumes/${id}`);
  return response.data;
};

export const downloadResume = async (id) => {
  const response = await api.get(`/api/resumes/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

export const setActiveResume = async (id) => {
  const response = await api.post(`/api/resumes/${id}/active`);
  return response.data;
};

// --- History & Reports APIs ---

export const getAnalyses = async () => {
  const response = await api.get('/api/analyses');
  return response.data;
};

export const deleteAnalysis = async (id) => {
  const response = await api.delete(`/api/analyses/${id}`);
  return response.data;
};

export const duplicateAnalysis = async (id) => {
  const response = await api.post(`/api/analyses/${id}/duplicate`);
  return response.data;
};

export const getReportsList = async () => {
  const response = await api.get('/api/reports');
  return response.data;
};

export const deleteReportLog = async (id) => {
  const response = await api.delete(`/api/reports/${id}`);
  return response.data;
};

export const trackReportDownload = async (id) => {
  const response = await api.post(`/api/reports/${id}/download-track`);
  return response.data;
};

export const generateRewrite = async (resumeName, resumeText, jobDescText, analysisResults) => {
  const response = await api.post('/api/rewrites', {
    resume_name: resumeName,
    resume_text: resumeText,
    job_desc_text: jobDescText,
    analysis_results: analysisResults
  });
  return response.data;
};

export const getRewritesList = async () => {
  const response = await api.get('/api/rewrites');
  return response.data;
};

export const generateInterviewPrep = async (resumeName, jobTitle, missingSkills) => {
  const response = await api.post('/api/interview_prep', {
    resume_name: resumeName,
    job_title: jobTitle,
    missing_skills: missingSkills
  });
  return response.data;
};

export const getInterviewPrepHistory = async () => {
  const response = await api.get('/api/interview_prep');
  return response.data;
};

export const generateProjectRecommendations = async (resumeName, jobTitle, missingSkills) => {
  const response = await api.post('/api/project_recommendations', {
    resume_name: resumeName,
    job_title: jobTitle,
    missing_skills: missingSkills
  });
  return response.data;
};

export const getProjectRecommendationsHistory = async () => {
  const response = await api.get('/api/project_recommendations');
  return response.data;
};

export const startMockInterview = async (
  jobTitle,
  interviewType,
  difficultyLevel,
  duration,
  missingSkills,
  companyName = "Generic Software Company",
  topicFocus = "Mixed Interview",
  practiceMode = "standard",
  enableAdaptive = false
) => {
  const response = await api.post('/api/interview/start', {
    job_title: jobTitle,
    interview_type: interviewType,
    difficulty_level: difficultyLevel,
    duration: duration,
    missing_skills: missingSkills,
    company_name: companyName,
    topic_focus: topicFocus,
    practice_mode: practiceMode,
    enable_adaptive: enableAdaptive
  });
  return response.data;
};

export const submitRawAnswer = async (interviewId, questionIdx, answer) => {
  const response = await api.post('/api/interview/answer', {
    session_id: interviewId,
    question_idx: questionIdx,
    answer: answer
  });
  return response.data;
};

export const submitInterviewAnswer = async (interviewId, questionIdx, question, answer, responseTime) => {
  const response = await api.post('/api/interview/analyze', {
    session_id: interviewId,
    question_idx: questionIdx,
    question: question,
    answer: answer,
    response_time: responseTime
  });
  return response.data;
};

export const finalizeMockInterview = async (interviewId, presentationAnalysis) => {
  const response = await api.post('/api/interview/end', {
    session_id: interviewId,
    presentation_analysis: presentationAnalysis
  });
  return response.data;
};

export const getMockInterviewsHistory = async () => {
  const response = await api.get('/api/interview/history');
  return response.data;
};

export const deleteMockInterview = async (id) => {
  const response = await api.delete(`/api/interview/${id}`);
  return response.data;
};

export const downloadInterviewReport = async (id) => {
  const response = await api.get(`/api/interview/${id}/report`, {
    responseType: 'blob'
  });
  return response.data;
};

// --- Core Matching APIs ---

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeResume = async (resumeText, jobDescText, weights = null, resumeId = null) => {
  const response = await api.post('/api/analyze', {
    resume_text: resumeText,
    resume_id: resumeId,
    job_desc_text: jobDescText,
    weights,
  });
  return response.data;
};

export const downloadReport = async (analysis, resumeName, jobTitle) => {
  const response = await api.post(
    '/api/download_report',
    {
      analysis,
      resume_name: resumeName,
      job_title: jobTitle,
    },
    {
      responseType: 'blob', // Critical for binary PDF downloads
    }
  );
  return response.data;
};

export default api;
