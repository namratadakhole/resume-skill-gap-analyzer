import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Play, CheckCircle, Menu, X, ChevronDown, ChevronUp, 
  Award, Zap, Brain, FileText, RefreshCw, BarChart3, 
  ArrowRight, Clock, HelpCircle, Github, Linkedin, 
  Target, GraduationCap, ChevronRight, Star, Heart
} from 'lucide-react';

export default function Landing({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const canvasRef = useRef(null);

  // Background particles canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = `rgba(148, 163, 184, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const count = Math.min(60, Math.floor(canvas.width / 20));
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    init();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const features = [
    {
      title: "ATS Score Analysis",
      description: "Instantly evaluate how parsing systems interpret your resume structure and layout guidelines.",
      icon: BarChart3,
      color: "text-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
    },
    {
      title: "Skill Gap Detection",
      description: "Compare your resume profile against hiring needs to reveal exact technical and soft skill gaps.",
      icon: Target,
      color: "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
    },
    {
      title: "AI Resume Optimization",
      description: "Generate tailored descriptions and action verbs that align perfectly with the target vacancy criteria.",
      icon: Brain,
      color: "text-purple-500 bg-purple-500/5 dark:bg-purple-500/10"
    },
    {
      title: "Resume Rewriter",
      description: "Instantly draft bullet points that highlight impact and metrics using executive phrasing structures.",
      icon: RefreshCw,
      color: "text-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10"
    },
    {
      title: "AI Interview Preparation",
      description: "Get bespoke mock interview questions designed specifically around your target role and resume details.",
      icon: HelpCircle,
      color: "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
    },
    {
      title: "Mock Interview Practice",
      description: "Test responses interactively and receive real-time, constructive feedback on presentation quality.",
      icon: Play,
      color: "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10"
    },
    {
      title: "Resume Reports",
      description: "Export high-quality, professionally formatted PDF summaries detailing compatibility metrics.",
      icon: FileText,
      color: "text-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10"
    },
    {
      title: "Career Recommendations",
      description: "Receive actionable next-step career paths and recommended certifications to bridge gaps.",
      icon: GraduationCap,
      color: "text-teal-500 bg-teal-500/5 dark:bg-teal-500/10"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Upload Resume",
      description: "Drop your PDF, DOCX, TXT, or scanned image into our secure parser platform."
    },
    {
      number: "02",
      title: "AI Analysis",
      description: "Our algorithms index formatting structure and text components against target vacancies."
    },
    {
      number: "03",
      title: "Skill Gap Detection",
      description: "Get a clear categorization of matched, missing, and extra skills."
    },
    {
      number: "04",
      title: "Personalized Report",
      description: "Review actionable tips and download a structured evaluation PDF."
    }
  ];

  const stats = [
    { value: "95%", label: "ATS Accuracy Rating", icon: Award },
    { value: "50K+", label: "Resumes Audited", icon: FileText },
    { value: "100%", label: "Secure Data Isolation", icon: Zap },
    { value: "<30s", label: "Instant Analysis Loop", icon: Clock }
  ];

  const testimonials = [
    {
      quote: "This engine completely re-aligned my background. I added 3 missing keywords and landed my first round of interviews within a week.",
      name: "Sarah Jenkins",
      role: "Lead Full-Stack Engineer",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120"
    },
    {
      quote: "The Mock Interview Coach generated questions that were practically identical to what the technical interviewers asked me. Outstanding tool.",
      name: "David Chen",
      role: "Senior Product Analyst",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120"
    },
    {
      quote: "I appreciated the formatting auditor. It highlighted that my double-column tables were unparseable by standard parser systems.",
      name: "Elena Rostova",
      role: "Software Developer",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120&h=120"
    }
  ];

  const faqs = [
    {
      q: "How does the ATS matching algorithm evaluate my resume?",
      a: "Our engine executes multi-stage evaluation pipelines. First, it extracts text layout blocks to test parser compatibility. Then, it uses Scikit-Learn TF-IDF vectorizers and Cosine Similarity models to compare your profile context directly against standard job requirement parameters."
    },
    {
      q: "Are my uploaded documents kept secure?",
      a: "Absolutely. All resume contents and personal credentials are fully isolated inside your secure MongoDB database account container. We do not sell user text context or expose profiles to external search indices."
    },
    {
      q: "Can I test image file formats or scans?",
      a: "Yes. Our document extraction layer features OCR parsers that clean up, preprocess, and extract textual data from uploaded PNG, JPG, or JPEG scanned templates."
    },
    {
      q: "How does the AI Interview Coach work?",
      a: "The Interview Coach analyzes the specific gap areas between your resume and target role. It dynamically drafts non-repetitive behavioral and technical interview questions, allows you to submit practice answers, and scores your response structure."
    }
  ];

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 overflow-x-hidden">
      
      {/* Glow Effects behind page */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[45%] h-[45%] rounded-full bg-purple-500/5 dark:bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleScrollTo('home')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-950 dark:text-white">
              CareerIQ
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500 dark:text-slate-400">
            <button onClick={() => handleScrollTo('home')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Home</button>
            <button onClick={() => handleScrollTo('features')} className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</button>
            <button onClick={() => handleScrollTo('how-it-works')} className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</button>
            <button onClick={() => handleScrollTo('why-choose-us')} className="hover:text-slate-900 dark:hover:text-white transition-colors">About</button>
            <span className="relative flex items-center gap-1 cursor-default opacity-60">
              Pricing
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">Soon</span>
            </span>
            <button onClick={() => handleScrollTo('faq')} className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQs</button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate('Login')}
              className="text-xs font-bold text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-colors py-2 px-3 focus:outline-none"
            >
              Login
            </button>
            <button 
              onClick={() => onNavigate('Register')}
              className="text-xs font-bold bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-2.5 px-4.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm focus:outline-none"
            >
              Get Started
            </button>
          </div>

          {/* Mobile hamburger toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 transition-colors duration-200 px-6 py-6 space-y-4"
            >
              <div className="flex flex-col gap-3 font-semibold text-sm">
                <button onClick={() => handleScrollTo('home')} className="text-left py-2 hover:text-blue-500 transition-colors">Home</button>
                <button onClick={() => handleScrollTo('features')} className="text-left py-2 hover:text-blue-500 transition-colors">Features</button>
                <button onClick={() => handleScrollTo('how-it-works')} className="text-left py-2 hover:text-blue-500 transition-colors">How It Works</button>
                <button onClick={() => handleScrollTo('why-choose-us')} className="text-left py-2 hover:text-blue-500 transition-colors">About</button>
                <div className="flex items-center gap-2 py-2 text-slate-400 dark:text-slate-500">
                  <span>Pricing</span>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-450 px-1.5 py-0.5 rounded font-extrabold uppercase">Coming Soon</span>
                </div>
                <button onClick={() => handleScrollTo('faq')} className="text-left py-2 hover:text-blue-500 transition-colors">FAQs</button>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); onNavigate('Login'); }}
                  className="w-full text-center font-bold text-sm text-slate-700 dark:text-slate-350 py-3 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  Login
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onNavigate('Register'); }}
                  className="w-full text-center font-bold text-sm bg-slate-950 dark:bg-white text-white dark:text-slate-955 dark:text-slate-950 py-3 rounded-xl"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 1. Hero Section */}
      <section id="home" className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 md:py-32 flex flex-col items-center justify-center text-center">
        {/* Floating Particles Canvas backdrop */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 shadow-sm text-slate-600 dark:text-slate-400 animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Powered by career intelligence models</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
            Land Your Dream Job with <br/>
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Resume Analysis
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Audit your resume layout coordinates, identify key missing skills, rewrite impact bullets, and test your readiness with our adaptive AI Mock Interview Coach. Built to match modern applicant tracking systems.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <button 
              onClick={() => onNavigate('Register')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-7 py-3.5 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-all focus:outline-none"
            >
              Analyze Resume
              <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-7 py-3.5 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all focus:outline-none"
            >
              <Play className="h-4 w-4 fill-current text-blue-500" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Feature Dashboard Preview Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 mt-16 md:mt-24 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 shadow-2xl"
        >
          <div className="rounded-xl border border-slate-200/50 dark:border-slate-905 dark:border-slate-900 bg-slate-50 dark:bg-slate-909 dark:bg-slate-900 overflow-hidden aspect-[16/10] flex flex-col">
            {/* Mock Header Controls */}
            <div className="h-9 bg-white dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-900/60 px-4 flex items-center gap-1.5 shrink-0">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-4 h-5 w-40 rounded bg-slate-100 dark:bg-slate-900" />
            </div>
            
            {/* Mock Dashboard Layout */}
            <div className="flex-1 p-6 grid grid-cols-3 gap-6 text-left overflow-hidden">
              <div className="col-span-2 space-y-6">
                <div className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-60 rounded bg-slate-100 dark:bg-slate-900" />
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 flex items-center justify-center font-bold text-xs">
                    78%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-950/50 p-4 space-y-3">
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5 pt-2">
                      <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-900" />
                      <div className="h-2 w-4/5 rounded bg-slate-100 dark:bg-slate-900" />
                    </div>
                  </div>
                  <div className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-955 dark:bg-slate-950/50 p-4 space-y-3">
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-1.5 pt-2">
                      <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-900" />
                      <div className="h-2 w-3/4 rounded bg-slate-100 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-955 dark:bg-slate-950/50 p-5 space-y-4">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-2.5 items-start">
                      <div className="h-4 w-4 rounded bg-blue-500/10 text-blue-500 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                        <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-900" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/40 dark:border-slate-900/60">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-450 uppercase tracking-widest">Core Capabilities</h2>
          <p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Designed for Modern Hiring Workflows
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to verify, optimize, and submit outstanding applications built directly inside a single platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-950/40 p-6 shadow-soft hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all duration-300 space-y-5"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-955 dark:text-slate-955 dark:text-white group-hover:text-blue-500 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/40 dark:border-slate-900/60 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-450 uppercase tracking-widest">Process Flow</h2>
            <p className="text-3xl font-extrabold tracking-tight text-slate-955 dark:text-slate-955 dark:text-white">
              How the Analyzer Optimizes Your Application
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Follow our fast and secure 4-step path to align your credentials with career opportunities.
            </p>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {steps.map((s, idx) => (
              <div key={idx} className="relative space-y-4">
                {/* Timeline connector line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-[1px] bg-slate-200 dark:bg-slate-800 z-0" />
                )}

                {/* Step indicator */}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black text-slate-955 dark:text-slate-955 dark:text-white shadow-soft">
                  {s.number}
                </div>

                <div className="space-y-1.5 pt-2">
                  <h3 className="text-sm font-bold text-slate-955 dark:text-slate-955 dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us Section */}
      <section id="why-choose-us" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-blue-600 dark:text-blue-450 uppercase tracking-widest">Platform Accuracy</h2>
              <p className="text-3xl font-extrabold tracking-tight text-slate-955 dark:text-slate-955 dark:text-white leading-tight">
                Designed to Bypass Automated Gatekeepers
              </p>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard resume screening layers discard up to 75% of qualified submissions due to formatting bugs, table errors, or keyword matches. CareerIQ bridges this gap using precise NLP matching pipelines that mirror actual enterprise parser schemas.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex gap-3 items-center">
                <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold">100% compliant with standard parsing frameworks.</span>
              </div>
              <div className="flex gap-3 items-center">
                <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold">Real-time keyword matching with synonym expansion.</span>
              </div>
              <div className="flex gap-3 items-center">
                <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold">Adaptive interview coaching based on specific profile gaps.</span>
              </div>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-950/45 p-6 shadow-soft space-y-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/5 dark:bg-blue-500/10 text-blue-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-955 dark:text-slate-955 dark:text-white tracking-tight">
                      {st.value}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      {st.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Testimonials Section */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/40 dark:border-slate-900/60 py-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-450 uppercase tracking-widest">Success Stories</h2>
            <p className="text-3xl font-extrabold tracking-tight text-slate-955 dark:text-slate-955 dark:text-white">
              Recommended by Tech Professionals
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Read how candidates optimize their technical credentials to land roles at leading software firms.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-950/50 p-6 shadow-soft flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
                  <img 
                    src={t.avatar} 
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-955 dark:text-slate-955 dark:text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-450 uppercase tracking-widest">Common Questions</h2>
          <p className="text-3xl font-extrabold tracking-tight text-slate-955 dark:text-slate-955 dark:text-white">
            Frequently Asked Questions
          </p>
        </div>

        {/* Expandable Accordions */}
        <div className="space-y-4">
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 dark:bg-slate-955 dark:bg-slate-950/40 overflow-hidden shadow-soft transition-all duration-200"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-xs sm:text-sm text-slate-955 dark:text-slate-955 dark:text-white focus:outline-none"
                >
                  <span>{f.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-450" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-450" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed"
                    >
                      {f.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Call To Action (CTA) Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative rounded-3xl bg-slate-900 dark:bg-slate-900 border border-slate-800 p-8 md:p-16 text-center text-white overflow-hidden shadow-xl">
          {/* Visual gradient overlay inside CTA */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ready to Improve Your Resume?
            </h2>
            <p className="text-xs sm:text-sm text-slate-350 leading-relaxed">
              Sign up today to audit your active resume template, receive tailored suggestions, and start preparing with your AI Interview Coach.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => onNavigate('Register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 px-7 py-3 text-xs font-extrabold hover:bg-slate-100 transition-colors focus:outline-none"
              >
                Start Free Analysis
              </button>
              <button 
                onClick={() => onNavigate('Register')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 text-white px-7 py-3 text-xs font-extrabold hover:bg-slate-800 transition-colors focus:outline-none"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer Section */}
      <footer className="border-t border-slate-200/50 dark:border-slate-900 bg-white dark:bg-slate-955 dark:bg-slate-950 text-slate-500 dark:text-slate-450 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          
          {/* Logo column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold tracking-tight text-slate-955 dark:text-slate-955 dark:text-white">
                CareerIQ
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              High-fidelity resume indexing, skill alignment matching, and customized career interview coaching.
            </p>
            <div className="flex gap-4 items-center pt-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-955 dark:text-slate-955 dark:text-white text-[10px]">Company</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleScrollTo('home')} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors">Home</button>
              <button onClick={() => handleScrollTo('why-choose-us')} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors">About Us</button>
              <span className="text-left opacity-50 cursor-default">Careers</span>
              <span className="text-left opacity-50 cursor-default">Privacy Policy</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-955 dark:text-slate-955 dark:text-white text-[10px]">Product</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleScrollTo('features')} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors">Features</button>
              <button onClick={() => handleScrollTo('how-it-works')} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</button>
              <div className="flex items-center gap-1.5 opacity-55">
                <span>Pricing</span>
                <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-455 px-1 py-0.2 rounded font-black tracking-widest uppercase">Soon</span>
              </div>
              <button onClick={() => handleScrollTo('faq')} className="text-left hover:text-slate-900 dark:hover:text-white transition-colors">FAQs</button>
            </div>
          </div>

          {/* Contact details */}
          <div className="space-y-3">
            <h4 className="font-extrabold uppercase tracking-wider text-slate-955 dark:text-slate-955 dark:text-white text-[10px]">Support & Contact</h4>
            <p className="leading-relaxed">
              Have questions or feedback? Reach out to our technical support team.
            </p>
            <p className="font-bold text-slate-800 dark:text-slate-350">
              support@careeriq.ai
            </p>
          </div>
        </div>

        {/* Copyright notice bar */}
        <div className="max-w-7xl mx-auto px-6 py-6 border-t border-slate-100 dark:border-slate-900 text-center text-[10px] text-slate-400">
          <p>© {new Date().getFullYear()} CareerIQ Inc. All rights reserved. Land your dream job with automated skill alignment.</p>
        </div>
      </footer>

      {/* Demo video player modal overlay */}
      <AnimatePresence>
        {demoModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-905 bg-slate-900 p-4 shadow-2xl flex flex-col gap-4 text-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4.5 w-4.5 text-blue-500 fill-current" />
                  <span className="font-bold text-xs tracking-wider uppercase">CareerIQ Platform Demo walkthrough</span>
                </div>
                <button 
                  onClick={() => setDemoModalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Video Mock placeholder frame */}
              <div className="rounded-xl bg-black aspect-video flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-transparent pointer-events-none" />
                <Play className="h-14 w-14 text-white fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 cursor-pointer" />
                <p className="text-xs text-slate-400 mt-4 tracking-wider uppercase font-semibold">Simulated Demo playback loop</p>
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                  <span>0:00 / 2:30</span>
                  <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-12 bg-blue-500" />
                  </div>
                  <span>1080p HD</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
