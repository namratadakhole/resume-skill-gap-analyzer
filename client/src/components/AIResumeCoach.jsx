import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';

export default function AIResumeCoach({ results, resumeName }) {
  const { settings } = useSettings();
  const [messages, setMessages] = useState([
    {
      sender: 'coach',
      text: "Hello! I am your AI Resume Coach. I've audited your resume against the target job requirements. Select one of the questions below or ask a question to begin optimizing your profile.",
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  // Fetch previous chats on boot
  useEffect(() => {
    const fetchChatLogs = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;
      try {
        const response = await api.get('/api/interview_sessions');
        if (response.data.length > 0) {
          const loaded = [
            {
              sender: 'coach',
              text: "Welcome back! Here is your saved interview coach session history. Feel free to ask more questions below.",
            }
          ];
          response.data.forEach(log => {
            loaded.push({ sender: 'user', text: log.query });
            loaded.push({ sender: 'coach', text: log.response });
          });
          setMessages(loaded);
        }
      } catch (err) {
        console.error('Failed to restore interview sessions history:', err);
      }
    };

    fetchChatLogs();
  }, []);

  const prompts = [
    { label: 'Why is my ATS score low?', query: 'Why is my ATS score low?' },
    { label: 'Which skills are missing?', query: 'Which skills are missing?' },
    { label: 'What projects should I build?', query: 'What projects should I build?' },
    { label: 'Which certifications are recommended?', query: 'Which certifications are recommended?' },
  ];

  // Helper response builder
  const generateResponse = (query) => {
    if (!results) return 'Please run the analysis first to generate insights.';

    const score = results.ats_score;
    const similarity = results.semantic_score;
    const skillMatch = results.skills_match_score;
    const formatting = results.formatting_score;
    const missingSkills = results.skills?.missing || [];
    const missingCategorized = results.skills?.categorized_missing || {};
    const formatChecks = results.formatting_checks || [];

    const lowerQuery = query.toLowerCase();
    let baseResponse = "";

    // 1. Why is my ATS score low?
    if (lowerQuery.includes('low') || lowerQuery.includes('ats score')) {
      const formattingIssues = formatChecks.filter(c => c.status !== 'Pass');
      baseResponse = `Your ATS compatibility index is currently evaluated at ${score}%. Here is a breakdown of what is dragging it down:

1. Semantic Match (${similarity}%): Your resume's general semantic context has moderate alignment with the job description.
2. Keyword Match (${results.keyword_score}%): Your lexical text matching via TF-IDF cosine similarity shows gaps.
3. Skill Coverage (${skillMatch}%): You are missing ${missingSkills.length} required technical or soft skills.
`;
      if (formattingIssues.length > 0) {
        baseResponse += `\nWe also detected ${formattingIssues.length} issues in layout headers or contacts, including: ${formattingIssues.map(i => `'${i.name}'`).join(', ')}.`;
      } else {
        baseResponse += `\nYour layout and formatting looks clean (${formatting}%). Your issues are strictly related to skill gaps and wording.`;
      }
    }

    // 2. Which skills are missing?
    else if (lowerQuery.includes('missing') || lowerQuery.includes('skills')) {
      if (missingSkills.length === 0) {
        baseResponse = 'Congratulations! Our analysis shows zero skill gaps. You have all required keywords.';
      } else {
        baseResponse = `Based on our synonym-aware keyword audit, the following key competencies requested in the job description are missing from your resume:\n\n`;
        Object.entries(missingCategorized).forEach(([category, skills]) => {
          baseResponse += `- **${category}**: ${skills.join(', ')}\n`;
        });
      }
    }

    // 3. What projects should I build?
    else if (lowerQuery.includes('project') || lowerQuery.includes('build')) {
      if (missingSkills.length === 0) {
        baseResponse = 'Since you match all skills, focus on styling your portfolio and sharing it with hiring managers!';
      } else {
        baseResponse = `Here are specific project designs to demonstrate competency in your missing areas:\n\n`;
        const missingSet = new Set(missingSkills.map(s => s.toLowerCase()));
        let count = 0;

        if ((missingSet.has('docker') || missingSet.has('kubernetes')) && count < 3) {
          baseResponse += `* **Containerized Deployment Pipeline** (Docker/K8s)
  Build a multi-container application (e.g., React frontend + Node backend + PostgreSQL database), write Dockerfiles, compose a Docker Compose stack, and write manifest configuration charts to run the entire app locally under Kubernetes.
  
`;
          count++;
        }

        if ((missingSet.has('aws') || missingSet.has('azure') || missingSet.has('gcp')) && count < 3) {
          baseResponse += `* **Serverless Cloud Application** (AWS/Azure/GCP)
  Build a microservice deploying serverless functions (like AWS Lambda) connected to a serverless file repository (AWS S3) and NoSQL store (DynamoDB). Automate deployments using CI/CD pipelines (GitHub Actions).
  
`;
          count++;
        }

        if ((missingSet.has('postgresql') || missingSet.has('mongodb') || missingSet.has('redis')) && count < 3) {
          baseResponse += `* **High-Performance Database Architect** (PostgreSQL/Redis)
  Design a mock database schema for a SaaS platform. Implement relational tables, composite indexing, stored triggers in PostgreSQL, and configure a Redis memory layer to cache heavy queries and decrease response times.
  
`;
          count++;
        }

        if ((missingSet.has('scikit-learn') || missingSet.has('tensorflow') || missingSet.has('pytorch') || missingSet.has('machine learning')) && count < 3) {
          baseResponse += `* **Predictive ML Endpoint API** (Python / Machine Learning)
  Train a scikit-learn classifier model on a dataset. Package the serialized model inside a FastAPI server, and expose endpoints to send data inputs and receive predictions. Write unit tests to check threshold metrics.
  
`;
          count++;
        }

        if (count === 0) {
          const sampleSkills = missingSkills.slice(0, 3).join(', ');
          baseResponse += `* **Targeted Showcase Repository**
  Create a GitHub repository deploying a web service that explicitly integrates: ${sampleSkills}. Document the system architecture in your README.md to demonstrate technical comprehension.`;
        }
      }
    }

    // 4. Which certifications are recommended?
    else if (lowerQuery.includes('cert') || lowerQuery.includes('credential')) {
      const certs = results.recommendations?.filter(r => r.type === 'Certification') || [];
      if (certs.length === 0) {
        baseResponse = 'No specific certifications are currently recommended for this role match. Focusing on portfolio projects is advised.';
      } else {
        baseResponse = `Based on your missing skills, we recommend pursuing the following industry certifications:\n\n`;
        certs.forEach((c, idx) => {
          const cleanResource = c.action.replace(/Acquire foundational knowledge in .*\. We recommend: /, '').replace(/\.$/, '');
          baseResponse += `${idx + 1}. **${c.skill}**: We recommend the **${cleanResource}**.\n`;
        });
      }
    }

    else {
      baseResponse = "I can help with specific resume topics. Try asking: 'Why is my ATS score low?', 'Which skills are missing?', 'What projects should I build?', or 'Which certifications are recommended?'";
    }

    // Apply AI Coach response style overrides
    const style = settings.aiCoach.responseStyle;
    if (style === 'Short') {
      return baseResponse.split('\n').filter(line => line.trim().length > 0).slice(0, 5).join('\n') + "\n\n*(Summary mode activated)*";
    }
    if (style === 'Detailed') {
      return baseResponse + `\n\n**Technical Audit Context**:
- Semantic Vector Dimensions: 384 (all-MiniLM-L6-v2)
- Match Threshold: Cosine similarity threshold >= 0.50
- Keyword Normalization: Synonym matched & boundary safe evaluation.`;
    }
    if (style === 'Interview Focused') {
      return baseResponse + `\n\n💡 **Interview Preparation tip**:
If asked about these skills in your interview, prepare a STAR response. Frame these recommendations as solutions you've designed to overcome scale or deployment limitations.`;
    }
    if (style === 'Career Mentor') {
      return baseResponse + `\n\n🌟 **Mentor Insight**:
Skill gaps are just milestones. Focus on the high priority items first. Building a simple prototype counts more than passive reading. Keep iterating!`;
    }

    // Professional is default
    return baseResponse;
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputValue('');

    const reply = generateResponse(text);
    
    // Add coach reply
    setMessages((prev) => [...prev, { sender: 'coach', text: reply }]);

    // Persist to MongoDB
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        await api.post('/api/interview_sessions', { query: text, response: reply });
      }
    } catch (err) {
      console.error('Failed to log interview session in database:', err);
    }
  };

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft overflow-hidden">
      {/* Coach Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">AI Resume Coach</h4>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Style: {settings.aiCoach.responseStyle}</p>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
              msg.sender === 'user'
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-950 dark:border-slate-200'
            }`}>
              {msg.sender === 'user' ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            
            <div className={`rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                : 'bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-pre-wrap'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Prompts inside panel */}
      {messages.length === 1 && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20 shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Suggested Prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none"
              >
                <Sparkles className="h-3 w-3 inline mr-1 text-slate-400" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 p-3 shrink-0"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question about your resume audit..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition-colors shadow-sm focus:outline-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
