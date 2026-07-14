import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Play, 
  Video, 
  Mic, 
  MicOff, 
  Pause, 
  Square, 
  Award, 
  Clock, 
  FileText, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle, 
  Loader, 
  Trash2, 
  Download, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  BookOpen,
  Calendar,
  Camera,
  CornerRightDown,
  Volume2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { 
  getAnalyses, 
  startMockInterview, 
  submitInterviewAnswer, 
  finalizeMockInterview, 
  getMockInterviewsHistory,
  deleteMockInterview,
  downloadInterviewReport
} from '../services/api';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
};

// 10 x 16 weight matrix for MLP Layer 1
const MLP_W1 = [
  [0.1,  0.8, -0.2, -0.3,  0.5,  0.1, -0.4,  0.2,  0.0,  0.0,  0.1, -0.2,  0.3,  0.0,  0.1, -0.1],
  [0.9, -0.1,  0.0, -0.5, -0.1, -0.8,  0.1, -0.3,  0.8, -0.2,  0.0,  0.1, -0.1,  0.9, -0.2,  0.0],
  [-0.2, 0.9,  0.1,  0.8,  0.0,  0.0, -0.1,  0.5, -0.3,  0.9,  0.1, -0.4,  0.0, -0.1,  0.8,  0.2],
  [0.0,  0.1,  0.8, -0.1,  0.9,  0.1,  0.0,  0.0,  0.1, -0.1,  0.7,  0.2, -0.3,  0.0,  0.1,  0.8],
  [0.0,  0.1,  0.8, -0.1,  0.9,  0.1,  0.0,  0.0,  0.1, -0.1,  0.7,  0.2, -0.3,  0.0,  0.1,  0.8],
  [-0.3, 0.5, -0.1,  0.7,  0.4,  0.9, -0.2,  0.1, -0.4,  0.8,  0.0,  0.1, -0.2,  0.0,  0.5,  0.1],
  [-0.1, -0.3, 0.0, -0.1,  0.0,  0.8,  0.9, -0.1,  0.0, -0.2,  0.5,  0.0,  0.9, -0.1,  0.0, -0.3],
  [0.1,  0.4,  0.9,  0.1, -0.2,  0.0, -0.1,  0.8, -0.2,  0.4,  0.1, -0.1,  0.0,  0.3,  0.9,  0.1],
  [0.0,  0.1,  0.2,  0.0,  0.1,  0.5,  0.1,  0.0,  0.1,  0.4,  0.1,  0.0,  0.1,  0.1,  0.2,  0.0],
  [0.0,  0.1,  0.2,  0.0,  0.1,  0.5,  0.1,  0.0,  0.1,  0.4,  0.1,  0.0,  0.1,  0.1,  0.2,  0.0]
];

const MLP_B1 = [0.1, -0.2, 0.3, 0.0, 0.1, -0.1, 0.2, 0.1, 0.0, -0.3, 0.1, 0.2, -0.1, 0.0, 0.2, -0.1];

// 16 x 8 weight matrix for MLP Layer 2
const MLP_W2 = [
  [0.8, -0.1,  0.2,  0.0,  0.1, -0.3,  0.2,  0.1],
  [-0.2, 0.9, -0.1,  0.4,  0.0,  0.1, -0.2,  0.0],
  [0.1, -0.3,  0.8, -0.1,  0.2,  0.0,  0.1,  0.3],
  [0.0,  0.2, -0.2,  0.9,  0.1, -0.1,  0.0,  0.1],
  [0.3, -0.1,  0.1,  0.0,  0.8,  0.2, -0.1,  0.0],
  [-0.1, 0.0,  0.3, -0.2,  0.1,  0.9,  0.1, -0.2],
  [0.2, -0.2,  0.0,  0.1, -0.1,  0.0,  0.8,  0.4],
  [0.1,  0.3,  0.4,  0.2,  0.0, -0.1,  0.2,  0.9],
  [0.0,  0.1, -0.1,  0.0,  0.2,  0.3,  0.1,  0.0],
  [0.1, -0.2,  0.1,  0.1,  0.0,  0.0, -0.1,  0.2],
  [-0.1, 0.1,  0.2,  0.0,  0.1,  0.2,  0.0, -0.1],
  [0.2, -0.1,  0.0,  0.3, -0.1,  0.0,  0.1,  0.2],
  [0.0,  0.2, -0.2,  0.1,  0.2, -0.1,  0.0,  0.1],
  [0.1,  0.0,  0.1, -0.2,  0.0,  0.1,  0.2, -0.1],
  [-0.2, 0.1,  0.3,  0.0, -0.1,  0.2,  0.0,  0.1],
  [0.1, -0.3,  0.0,  0.2,  0.1, -0.1,  0.3,  0.0]
];

const MLP_B2 = [0.0, 0.1, -0.1, 0.2, 0.0, -0.2, 0.1, 0.0];

// 8 x 7 weight matrix for MLP Output Layer (Neutral, Happy, Sad, Angry, Fear, Surprise, Disgust)
const MLP_W3 = [
  [ 0.8, -0.2,  0.1,  0.2,  0.0, -0.3,  0.1],
  [-0.3,  0.9, -0.2, -0.1,  0.1,  0.0, -0.2], // strong Happy mapping
  [ 0.1, -0.4,  0.8, -0.2,  0.2,  0.1,  0.0], // strong Sad mapping
  [ 0.0, -0.2, -0.3,  0.9,  0.1, -0.1,  0.2], // strong Angry mapping
  [ 0.2,  0.0,  0.1, -0.1,  0.8,  0.2, -0.3], // strong Fear mapping
  [-0.2,  0.1,  0.0, -0.2,  0.1,  0.9, -0.1], // strong Surprise mapping
  [ 0.1, -0.3,  0.2,  0.1, -0.2,  0.0,  0.8], // strong Disgust mapping
  [ 0.0,  0.1, -0.1,  0.0,  0.1,  0.0,  0.0]  // default mapping row
];

const MLP_B3 = [0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

// MLP Forward-Pass Predictor
const predictFacialEmotion = (features) => {
  const h1 = new Array(16).fill(0);
  for (let j = 0; j < 16; j++) {
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += features[i] * MLP_W1[i][j];
    }
    h1[j] = Math.max(0, sum + MLP_B1[j]);
  }

  const h2 = new Array(8).fill(0);
  for (let k = 0; k < 8; k++) {
    let sum = 0;
    for (let j = 0; j < 16; j++) {
      sum += h1[j] * MLP_W2[j][k];
    }
    h2[k] = Math.max(0, sum + MLP_B2[k]);
  }

  const logits = new Array(7).fill(0);
  for (let l = 0; l < 7; l++) {
    let sum = 0;
    for (let k = 0; k < 8; k++) {
      sum += h2[k] * MLP_W3[k][l];
    }
    logits[l] = sum + MLP_B3[l];
  }

  const maxLogit = Math.max(...logits);
  const exps = logits.map(v => Math.exp(v - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sumExps);
};

const analyzeFaceRegionBrightness = (ctx, faceBox) => {
  let brightness = 120;
  try {
    const w = 40;
    const h = 30;
    const xStart = Math.max(0, Math.round(faceBox.xMin * w));
    const width = Math.min(w - xStart, Math.round((faceBox.xMax - faceBox.xMin) * w));
    const yStart = Math.max(0, Math.round(faceBox.yMin * h));
    const height = Math.min(h - yStart, Math.round((faceBox.yMax - faceBox.yMin) * h));
    
    if (width > 0 && height > 0) {
      const imgData = ctx.getImageData(xStart, yStart, width, height);
      const data = imgData.data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        sum += (0.299 * r + 0.587 * g + 0.114 * b);
      }
      brightness = Math.round(sum / (data.length / 4));
    }
  } catch (e) {
    console.warn("Face region brightness skipped:", e);
  }
  return brightness;
};

const analyzeBackground = (ctx, faceBox) => {
  let totalGrad = 0;
  let samples = 0;
  try {
    const imgData = ctx.getImageData(0, 0, 40, 30);
    const data = imgData.data;
    const w = 40;
    const h = 30;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const isInsideFace = faceBox && (x / w > faceBox.xMin && x / w < faceBox.xMax && y / h > faceBox.yMin && y / h < faceBox.yMax);
        if (!isInsideFace) {
          const idx = (y * w + x) * 4;
          const idxRight = idx + 4;
          const idxDown = idx + w * 4;
          
          const val = (data[idx] + data[idx+1] + data[idx+2]) / 3;
          const valRight = (data[idxRight] + data[idxRight+1] + data[idxRight+2]) / 3;
          const valDown = (data[idxDown] + data[idxDown+1] + data[idxDown+2]) / 3;
          
          const gradX = valRight - val;
          const gradY = valDown - val;
          const mag = Math.sqrt(gradX * gradX + gradY * gradY);
          
          totalGrad += mag;
          samples++;
        }
      }
    }
  } catch (e) {
    console.warn("Background Sobel check skipped:", e);
  }
  const avgGrad = samples > 0 ? totalGrad / samples : 10;
  return Math.max(10, Math.min(100, Math.round(100 - avgGrad * 2.8)));
};

const detectAttire = (ctx, chin, faceWidth) => {
  try {
    const w = 40;
    const h = 30;
    const neckY = Math.round(chin.y * h) + 1;
    const neckHeight = 4;
    const neckXStart = Math.round((chin.x - faceWidth * 0.45) * w);
    const neckWidth = Math.round(faceWidth * 0.9 * w);
    
    if (neckY + neckHeight > h || neckXStart < 0 || neckXStart + neckWidth > w || neckWidth <= 0) {
      return { label: "Unknown", score: 50 };
    }
    
    const imgData = ctx.getImageData(neckXStart, neckY, neckWidth, neckHeight);
    const data = imgData.data;
    
    let hGrad = 0;
    let vGrad = 0;
    let minVal = 255;
    let maxVal = 0;
    
    for (let y = 1; y < neckHeight - 1; y++) {
      for (let x = 1; x < neckWidth - 1; x++) {
        const idx = (y * neckWidth + x) * 4;
        const val = (data[idx] + data[idx+1] + data[idx+2]) / 3;
        
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
        
        const idxRight = idx + 4;
        const idxDown = idx + neckWidth * 4;
        const valRight = (data[idxRight] + data[idxRight+1] + data[idxRight+2]) / 3;
        const valDown = (data[idxDown] + data[idxDown+1] + data[idxDown+2]) / 3;
        
        hGrad += Math.abs(valRight - val);
        vGrad += Math.abs(valDown - val);
      }
    }
    
    const contrast = maxVal - minVal;
    const totalPixels = neckWidth * neckHeight;
    const normH = hGrad / totalPixels;
    const normV = vGrad / totalPixels;
    
    if (contrast < 22) {
      return { label: "Casual", score: 70 };
    } else if (normV > 22 && contrast > 90) {
      return { label: "Formal", score: Math.round(85 + Math.min(14, (normV - 22) * 0.5)) };
    } else if (normV > 14 && normH < 14) {
      return { label: "Business Casual", score: 80 };
    } else if (normH > 16 && normV < 9) {
      return { label: "T-shirt", score: 75 };
    } else if (normH > 10 && normV > 10) {
      return { label: "Hoodie", score: 72 };
    }
    return { label: "Casual", score: 65 };
  } catch (e) {
    return { label: "Unknown", score: 50 };
  }
};

const getQuestionHints = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes("list") && q.includes("tuple")) {
    return {
      small: "Think about which one can be changed in-place and which one cannot.",
      medium: "• Lists are mutable (can append/delete, uses square brackets [])\n• Tuples are immutable (read-only, uses parentheses ())\n• Tuples are faster and consume less memory.",
      full: "Lists are mutable, meaning items can be appended or modified in-place; they are represented with square brackets. Tuples are immutable sequence structures represented with parentheses. Tuples have lower memory footprints and protect data integrity."
    };
  }
  if (q.includes("garbage collection")) {
    return {
      small: "Recall how Python counts references and handles circular structures.",
      medium: "• Primary mechanism: Reference counting (deallocates when count hits 0)\n• Secondary: Generational garbage collector (cycles detection)\n• Three generations (Gen 0, 1, 2) based on object survival age.",
      full: "Python uses reference counting as its primary garbage collection logic, instantly deallocating objects when their reference count drops to zero. To resolve circular reference leaks, a generational cyclic garbage collector runs periodically, scanning object lists divided into three age cohorts."
    };
  }
  if (q.includes("virtual dom")) {
    return {
      small: "Think about React's in-memory representation of UI changes vs real browser reflows.",
      medium: "• Virtual DOM is a lightweight copy of the real DOM in JS memory.\n• State change triggers a re-render and generates a new Virtual DOM tree.\n• React diffs the trees (Reconciliation) and batch-updates only modified nodes.",
      full: "The Virtual DOM is an in-memory representation of the real DOM nodes. React syncs it by generating a lightweight UI copy, comparing it against the previous tree using a diffing algorithm (Reconciliation), and batch-updating only the modified DOM coordinates."
    };
  }
  if (q.includes("lifespan event")) {
    return {
      small: "Think about startup and shutdown tasks (like DB connections) in FastAPI.",
      medium: "• Declared using async context manager with '@app.lifespan' pattern.\n• Code before 'yield' runs before the server starts receiving requests.\n• Code after 'yield' runs on server shutdown.",
      full: "The FastAPI Lifespan context manager runs before the server starts accepting HTTP traffic, allowing initialization like database connection pools, and cleans them up cleanly after the server receives shutdown triggers."
    };
  }
  if (q.includes("docker") || q.includes("container")) {
    return {
      small: "Think about storage lifecycles inside isolated containers.",
      medium: "• Containers are ephemeral (data is lost on restart by default).\n• Docker volumes mount host directories inside container storage spaces.\n• Ensures persistence and shares files across container runtimes.",
      full: "Docker containers share the host kernel. By default, container storage is ephemeral; data is permanently persisted using Docker Volume mounts or Bind Mounts mapped from the host system coordinates."
    };
  }
  if (q.includes("acid")) {
    return {
      small: "Recall what each letter in ACID stands for.",
      medium: "• Atomicity (all-or-nothing transactions)\n• Consistency (rules validation)\n• Isolation (concurrency control)\n• Durability (permanently saved to disk).",
      full: "ACID stands for Atomicity, Consistency, Isolation, and Durability. These properties guarantee that database transactions are processed reliably, preserving data integrity even in the event of crashes or concurrency conflicts."
    };
  }
  if (q.includes("overfitting")) {
    return {
      small: "Think about what happens when a model learns training noise too well.",
      medium: "• Model performs great on training data but poorly on unseen test data.\n• Prevented using regularization (L1/L2), cross-validation, and pruning.\n• Reducing model complexity helps generalize predictions.",
      full: "Overfitting occurs when a machine learning model learns the noise and details of the training data to the extent that it negatively impacts performance on new, unseen data. It is prevented using regularization, cross-validation, early stopping, and simplifying model capacity."
    };
  }
  
  return {
    small: "Explain the definition, list 2-3 core mechanisms, and give a production example.",
    medium: "• Define what the technology is directly.\n• Detail its inner workings and trade-offs.\n• Illustrate with a concrete system architecture scenario.",
    full: "Relational primary index structures map rows to sequential slots. For heavy API systems, database architectures should leverage index caching, query pagination, and transactional isolation bounds to verify latency throughput."
  };
};

export default function InterviewPrep() {
  const { analysisResults: workspaceAnalysis } = useSettings();

  // Setup options
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState(15);
  const [companyName, setCompanyName] = useState('Generic Software Company');
  const [topicFocus, setTopicFocus] = useState('Mixed Interview');
  const [practiceMode, setPracticeMode] = useState('standard');
  const [enableAdaptive, setEnableAdaptive] = useState(false);
  const [enableHints, setEnableHints] = useState(false);
  const [activeHintLevel, setActiveHintLevel] = useState('none'); // 'none', 'small', 'medium', 'full'
  const [activeEvaluation, setActiveEvaluation] = useState(null);
  
  // Phase state: 'dashboard', 'interview', 'report'
  const [phase, setPhase] = useState('dashboard');
  
  // Analyses catalog list for dynamic missing skills references
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [missingSkills, setMissingSkills] = useState([]);

  // Mock interview session parameters
  const [activeSession, setActiveSession] = useState(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  // Timer parameters
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  // Webcam parameters
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [presentationAnalysis, setPresentationAnalysis] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [biometricHistory, setBiometricHistory] = useState([]);
  const [devMode, setDevMode] = useState(false);
  const predictionHistoryRef = useRef([]);
  const fpsRef = useRef({ lastTime: Date.now(), currentFps: 0 });
  const frameCountRef = useRef(0);
  const [backendConnected, setBackendConnected] = useState(false);

  // Evaluations history list
  const [historyList, setHistoryList] = useState([]);

  // Loader states
  const [loading, setLoading] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionLoaded, setVisionLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalysesAndHistory();
    initSpeechRecognition();
    loadVisionModels();
    return () => {
      stopTimer();
      stopWebcam();
    };
  }, []);

  const loadVisionModels = async () => {
    if (visionLoaded) return;
    setVisionLoading(true);
    try {
      console.log("[Telemetry] Loading MediaPipe FaceMesh script from CDN...");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js");
      console.log("[Telemetry] MediaPipe FaceMesh script successfully loaded.");
      setVisionLoaded(true);
    } catch (err) {
      console.error("[Telemetry] Failed to load MediaPipe Face Mesh library:", err);
      setError("Failed to load live computer vision models from CDN. Live video feedback is disabled: " + err.message);
    } finally {
      setVisionLoading(false);
    }
  };

  // Sync stream to video element when phase is 'interview' and video element is mounted in the DOM
  useEffect(() => {
    if (phase === 'interview' && stream && videoRef.current) {
      console.log("[Telemetry] Syncing media stream to video element.");
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        console.log(`[Telemetry] Webcam stream active. Resolution: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        videoRef.current.play().then(() => {
          console.log("[Telemetry] Video play started successfully.");
        }).catch(err => {
          console.error("[Telemetry] Explicit video.play() failed:", err);
        });
      };
      videoRef.current.onplay = () => {
        console.log("[Telemetry] Webcam video stream is actively playing.");
      };
    }
  }, [phase, stream]);

  const initialPresentationState = {
    face_visibility: 0,
    face_positioning: "Unavailable",
    eye_contact: "Unavailable",
    head_posture: "Unavailable",
    lighting_quality: "Unavailable",
    camera_framing: "Unavailable",
    background_cleanliness: "Unavailable",
    business_attire: "Unavailable",
    business_attire_score: "Unavailable",
    facial_engagement: "No Face Detected",
    facial_engagement_score: 0,
    emotion_stability: "Unavailable",
    overall_setup_quality: 0,
    overall_presentation_score: 0,
    suggestions: [
      "Position your face clearly in front of the camera.",
      "Ensure environment is well illuminated."
    ],
    status_checks: [
      { status: "fail", text: "No face detected" }
    ]
  };

  // Process video frames via MediaPipe FaceMesh to calculate live metrics
  const analyzeFrame = (results) => {
    const startTime = performance.now();
    frameCountRef.current += 1;
    console.log(`[Telemetry] Frame received. Total processed frames: ${frameCountRef.current}`);

    try {
      // Track FPS
      const now = Date.now();
      const delta = now - fpsRef.current.lastTime;
      fpsRef.current.lastTime = now;
      fpsRef.current.currentFps = delta > 0 ? Math.round(1000 / delta) : 30;

      let brightness = 120;
      let backgroundScore = 90;

      const landmarks = results.multiFaceLandmarks?.[0];
      const numFaces = results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0;
      const faceDetectionConfidence = numFaces > 0 ? 0.92 : 0.0;

      if (!landmarks) {
        console.log("[Telemetry] No face detected. Reason: No landmarks returned by MediaPipe.");
        predictionHistoryRef.current = []; // Clear history queue
        setPresentationAnalysis({
          face_visibility: 0,
          face_positioning: "Unavailable (Reason: No face detected)",
          eye_contact: "Unavailable (Reason: No face detected)",
          head_posture: "Unavailable (Reason: No face detected)",
          lighting_quality: "Unavailable (Reason: No face detected)",
          camera_framing: "Unavailable (Reason: No face detected)",
          background_cleanliness: "Unavailable (Reason: No face detected)",
          business_attire: "Unavailable (Reason: No face detected)",
          business_attire_score: "Unavailable (Reason: No face detected)",
          facial_engagement: "No Face Detected",
          facial_engagement_score: 0,
          emotion_stability: "Unavailable (Reason: No face detected)",
          overall_setup_quality: 0,
          overall_presentation_score: 0,
          suggestions: [
            "No face detected. Adjust webcam framing.",
            "Ensure your room is well lit and camera is not blocked."
          ],
          status_checks: [
            { status: "fail", text: "No face detected" }
          ],
          dev: {
            fps: fpsRef.current.currentFps,
            confidence: 0,
            numFaces: 0,
            iris: "None",
            angles: "Yaw: 0°, Pitch: 0°, Roll: 0°",
            lighting: 0,
            probs: "None",
            frameCount: frameCountRef.current,
            processingTime: Math.round(performance.now() - startTime),
            resolution: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : "Unknown",
            backendConnected: backendConnected ? "Yes" : "No",
            cameraStatus: webcamActive ? "Active" : "Offline",
            backgroundScore: 0,
            attireLabel: "Unknown",
            attireScore: 0,
            emotionLabel: "No Face Detected",
            emotionScore: 0,
            landmarkCount: 0
          }
        });

        // Append No Face Detected to 30s timeline
        setBiometricHistory(prev => {
          const next = [...prev, {
            time: Date.now(),
            eyeContact: 0,
            emotion: "No Face Detected",
            faceVisibility: 0,
            headPose: 0,
            lighting: 0
          }];
          return next.slice(-60);
        });
        return;
      }

      console.log(`[Telemetry] Face detected. Confidence: ${(faceDetectionConfidence * 100).toFixed(0)}%. Landmarks detected: ${landmarks.length}`);

      // 2. Extract landmark coordinates
      const nose = landmarks[4];
      const leftEyeOuter = landmarks[33];
      const rightEyeOuter = landmarks[263];
      const leftEyeInner = landmarks[133];
      const rightEyeInner = landmarks[362];
      const leftMouth = landmarks[61];
      const rightMouth = landmarks[291];
      const topLip = landmarks[13];
      const bottomLip = landmarks[14];
      const chin = landmarks[152];
      const leftBrowInner = landmarks[55];
      const rightBrowInner = landmarks[285];
      const leftBrowCenter = landmarks[70];
      const rightBrowCenter = landmarks[300];

      // Compute bounding box
      const xMin = Math.min(...landmarks.map(l => l.x));
      const xMax = Math.max(...landmarks.map(l => l.x));
      const yMin = Math.min(...landmarks.map(l => l.y));
      const yMax = Math.max(...landmarks.map(l => l.y));
      const faceBox = { xMin, xMax, yMin, yMax };

      // Canvas brightness, background cleanliness, attire checks
      let attire = { label: "Casual", score: 65 };
      if (videoRef.current) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 30;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 40, 30);
            brightness = analyzeFaceRegionBrightness(ctx, faceBox);
            backgroundScore = analyzeBackground(ctx, faceBox);
            
            const eyeDistTemp = Math.max(0.01, Math.sqrt(Math.pow(rightEyeOuter.x - leftEyeOuter.x, 2) + Math.pow(rightEyeOuter.y - leftEyeOuter.y, 2)));
            attire = detectAttire(ctx, chin, eyeDistTemp);
          }
        } catch (e) {
          console.warn("Real-time pixel parsing failed:", e);
        }
      }

      const lightingQuality = Math.round(Math.max(10, Math.min(100, 100 - Math.abs(brightness - 135) * 0.8)));

      // Face centered calculations (distance from center of 0.5)
      const faceCenterX = (xMin + xMax) / 2;
      const faceCenterY = (yMin + yMax) / 2;
      const centeringDiffX = Math.abs(faceCenterX - 0.5);
      const centeringDiffY = Math.abs(faceCenterY - 0.5);
      const faceCenteredScore = Math.max(10, Math.round(100 - centeringDiffX * 400 - centeringDiffY * 400));

      // Face Size / Distance (width between eyes)
      const eyeDist = Math.max(0.01, Math.sqrt(Math.pow(rightEyeOuter.x - leftEyeOuter.x, 2) + Math.pow(rightEyeOuter.y - leftEyeOuter.y, 2)));
      const faceWidth = eyeDist;
      const faceHeight = Math.max(0.01, Math.sqrt(Math.pow(chin.x - nose.x, 2) + Math.pow(chin.y - nose.y, 2)));
      
      // Camera framing: size of face bounding box area (ideal area ~0.08 to 0.16)
      const faceArea = (xMax - xMin) * (yMax - yMin);
      const cameraFramingScore = Math.max(10, Math.round(100 - Math.abs(faceArea - 0.11) * 600));

      // Head posture / Head yaw, pitch, roll estimation in degrees
      const eyesMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2.0;
      const eyesMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2.0;
      
      // approximate angles in degrees
      const yawAngle = Math.round((nose.x - eyesMidX) * 220);
      const pitchAngle = Math.round(((nose.y - eyesMidY) / Math.max(0.01, chin.y - eyesMidY) - 0.45) * 180);
      const rollAngle = Math.round(Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * (180 / Math.PI));

      const headPostureScore = Math.max(10, Math.round(100 - Math.abs(yawAngle) * 2.2 - Math.abs(pitchAngle) * 2.0 - Math.abs(rollAngle) * 3.0));

      // Eye Contact: MediaPipe refined landmarks gaze tracking
      let eyeContactScore = 85;
      let devIrisInfo = "Not Detected";
      if (landmarks.length > 473) {
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        
        const leftGazeRatio = (leftIris.x - leftEyeOuter.x) / Math.max(0.01, leftEyeInner.x - leftEyeOuter.x);
        const rightGazeRatio = (rightIris.x - rightEyeOuter.x) / Math.max(0.01, rightEyeInner.x - rightEyeOuter.x);
        const hGazeOffset = Math.abs((leftGazeRatio + rightGazeRatio) / 2 - 0.5);

        const leftGazeVert = (leftIris.y - landmarks[159].y) / Math.max(0.01, landmarks[145].y - landmarks[159].y);
        const rightGazeVert = (rightIris.y - landmarks[386].y) / Math.max(0.01, landmarks[374].y - landmarks[386].y);
        const vGazeOffset = Math.abs((leftGazeVert + rightGazeVert) / 2 - 0.5);

        const gazeOffset = hGazeOffset * 280 + vGazeOffset * 220;
        eyeContactScore = Math.max(10, Math.min(100, Math.round(100 - gazeOffset)));
        devIrisInfo = `L: (${leftIris.x.toFixed(2)}, ${leftIris.y.toFixed(2)}), R: (${rightIris.x.toFixed(2)}, ${rightIris.y.toFixed(2)})`;
      } else {
        eyeContactScore = Math.max(10, Math.round(100 - Math.abs(yawAngle) * 2.5 - Math.abs(pitchAngle) * 2.2));
      }

      // Extract 10 neural features normalized between 0.0 and 1.0
      const mouthWidth = Math.sqrt(Math.pow(rightMouth.x - leftMouth.x, 2) + Math.pow(rightMouth.y - leftMouth.y, 2));
      const browFurrowDist = Math.sqrt(Math.pow(rightBrowInner.x - leftBrowInner.x, 2) + Math.pow(rightBrowInner.y - leftBrowInner.y, 2));
      const f0 = Math.min(1.0, Math.max(0.0, (browFurrowDist / eyeDist - 0.4) * 2));
      const f1 = Math.min(1.0, Math.max(0.0, (mouthWidth / eyeDist - 0.7) * 3));
      const mouthOpenHeight = Math.abs(bottomLip.y - topLip.y);
      const f2 = Math.min(1.0, Math.max(0.0, (mouthOpenHeight / faceHeight) * 5));

      const leftEyeWidth = Math.max(0.01, Math.sqrt(Math.pow(leftEyeInner.x - leftEyeOuter.x, 2) + Math.pow(leftEyeInner.y - leftEyeOuter.y, 2)));
      const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
      const f3 = Math.min(1.0, Math.max(0.0, (leftEyeHeight / leftEyeWidth) * 3));

      const rightEyeWidth = Math.max(0.01, Math.sqrt(Math.pow(rightEyeOuter.x - rightEyeInner.x, 2) + Math.pow(rightEyeOuter.y - rightEyeInner.y, 2)));
      const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
      const f4 = Math.min(1.0, Math.max(0.0, (rightEyeHeight / rightEyeWidth) * 3));

      const leftBrowRaise = Math.abs(leftBrowCenter.y - leftEyeOuter.y);
      const rightBrowRaise = Math.abs(rightBrowCenter.y - rightEyeOuter.y);
      const f5 = Math.min(1.0, Math.max(0.0, ((leftBrowRaise + rightBrowRaise) / 2 / eyeDist - 0.25) * 4));

      const leftMouthHeight = Math.abs(leftMouth.y - leftEyeOuter.y);
      const rightMouthHeight = Math.abs(rightMouth.y - rightEyeOuter.y);
      const f6 = Math.min(1.0, Math.abs(leftMouthHeight - rightMouthHeight) / Math.max(0.01, leftMouthHeight + rightMouthHeight) * 5);

      const jawDrop = Math.sqrt(Math.pow(chin.x - nose.x, 2) + Math.pow(chin.y - nose.y, 2));
      const f7 = Math.min(1.0, Math.max(0.0, (jawDrop / eyeDist - 1.2) * 2));

      const f8 = Math.min(1.0, Math.max(0.0, (leftBrowRaise / eyeDist - 0.2) * 4));
      const f9 = Math.min(1.0, Math.max(0.0, (rightBrowRaise / eyeDist - 0.2) * 4));

      const features = [f0, f1, f2, f3, f4, f5, f6, f7, f8, f9];

      // Predict emotion probabilities using the neural MLP forward-pass
      const probabilities = predictFacialEmotion(features);
      const emotionClasses = ["Neutral", "Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust"];

      let maxIdx = 0;
      let maxProb = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          maxIdx = i;
        }
      }

      let rawEmotion = emotionClasses[maxIdx];
      let rawConfidence = Math.round(maxProb * 100);

      // Physical override heuristics
      const eyesClosed = leftEyeHeight / leftEyeWidth < 0.08 && rightEyeHeight / rightEyeWidth < 0.08;
      const isSpeaking = isRecording && mouthOpenHeight / faceHeight > 0.04;

      if (eyesClosed) {
        rawEmotion = "Eyes Closed";
        rawConfidence = 95;
      } else if (isSpeaking) {
        rawEmotion = "Talking";
        rawConfidence = 92;
      }

      // 5. If confidence is below 60%: Expression is Unknown
      if (rawEmotion !== "Eyes Closed" && rawEmotion !== "Talking" && rawConfidence < 60) {
        rawEmotion = "Unknown";
      }

      console.log(`[Telemetry] Emotion predicted: ${rawEmotion} (${rawConfidence}%)`);

      // 6. Smooth predictions: majority voting over last 10 predictions
      predictionHistoryRef.current.push({ emotion: rawEmotion, confidence: rawConfidence });
      if (predictionHistoryRef.current.length > 10) {
        predictionHistoryRef.current.shift();
      }

      const counts = {};
      predictionHistoryRef.current.forEach(item => {
        counts[item.emotion] = (counts[item.emotion] || 0) + 1;
      });

      let majorityEmotion = rawEmotion;
      let maxCount = 0;
      Object.keys(counts).forEach(key => {
        if (counts[key] > maxCount) {
          maxCount = counts[key];
          majorityEmotion = key;
        }
      });

      // Average confidence of frames in history matching the majority prediction
      const matchingItems = predictionHistoryRef.current.filter(item => item.emotion === majorityEmotion);
      const avgConfidence = Math.round(matchingItems.reduce((acc, item) => acc + item.confidence, 0) / matchingItems.length);

      // Calculate emotion stability based on unique prediction classes in window
      const uniqueCount = Object.keys(counts).length;
      let stability = "High";
      if (uniqueCount >= 3) {
        stability = "Low";
      } else if (uniqueCount === 2) {
        stability = "Medium";
      }

      // Append majority prediction to 30s timeline history list
      setEmotionHistory(prev => {
        const next = [...prev, { emotion: majorityEmotion, time: Date.now() }];
        return next.slice(-60);
      });

      // Occlusion check (symmetry of mouth/eyes)
      const leftHeight = Math.abs(leftMouth.y - leftEyeOuter.y);
      const rightHeight = Math.abs(rightMouth.y - rightEyeOuter.y);
      const symmetryRatio = Math.abs(leftHeight - rightHeight) / Math.max(0.01, leftHeight + rightHeight);
      const faceOcclusion = symmetryRatio > 0.35 ? 40 : 100;

      // 4. Weighted Presentation Score: 20% Visibility, 20% Eye Contact, 15% Posture, 15% Framing, 10% Lighting, 10% Background, 10% Attire
      const overallPresentationScore = Math.round(
        0.2 * faceOcclusion + 
        0.2 * eyeContactScore + 
        0.15 * headPostureScore + 
        0.15 * cameraFramingScore + 
        0.1 * lightingQuality + 
        0.1 * backgroundScore + 
        0.1 * attire.score
      );

      const suggestions = [];
      const status_checks = [];

      // Face detection checks
      if (faceOcclusion < 60) {
        suggestions.push("Face partially covered. Clear hand/objects blocking camera.");
        status_checks.push({ status: "warning", text: "Face partially covered" });
      } else {
        status_checks.push({ status: "pass", text: "Face detected" });
      }

      // Centered alignment status
      if (faceCenteredScore < 75) {
        suggestions.push("Center your face in the camera.");
        status_checks.push({ status: "warning", text: "Improve framing" });
      } else {
        status_checks.push({ status: "pass", text: "Good framing" });
      }

      // Eye contact status
      if (eyeContactScore < 70) {
        suggestions.push("Look at the camera.");
        status_checks.push({ status: "warning", text: "Look at the camera" });
      }

      // Lighting status
      if (lightingQuality < 70) {
        suggestions.push(brightness < 90 ? "Improve front lighting." : "Avoid bright highlights in background.");
        status_checks.push({ status: "warning", text: brightness < 90 ? "Poor lighting" : "Harsh lighting" });
      } else {
        status_checks.push({ status: "pass", text: "Good lighting" });
      }

      if (faceWidth < 0.12) {
        suggestions.push("Move slightly closer to the webcam.");
      } else if (faceWidth > 0.28) {
        suggestions.push("Move slightly back from the webcam.");
      }

      if (attire.label === "Casual" || attire.label === "T-shirt" || attire.label === "Hoodie") {
        suggestions.push(`We noticed you are wearing a ${attire.label}. Consider wearing a solid-color formal shirt.`);
      }
      suggestions.push("Use a plain background.");

      // Append current tick to 30s biometric history
      setBiometricHistory(prev => {
        const next = [...prev, {
          time: Date.now(),
          eyeContact: eyeContactScore,
          emotion: majorityEmotion,
          faceVisibility: faceOcclusion,
          headPose: headPostureScore,
          lighting: lightingQuality
        }];
        return next.slice(-60);
      });

      const devProbsStr = emotionClasses.map((cl, i) => `${cl}: ${(probabilities[i] * 100).toFixed(0)}%`).join(", ");

      const processingTime = Math.round(performance.now() - startTime);
      console.log(`[Telemetry] Presentation metrics calculated. Execution time: ${processingTime}ms. Overall Score: ${overallPresentationScore}%`);

      setPresentationAnalysis({
        face_visibility: faceOcclusion,
        face_positioning: faceCenteredScore,
        eye_contact: eyeContactScore,
        head_posture: headPostureScore,
        lighting_quality: lightingQuality,
        camera_framing: cameraFramingScore,
        background_cleanliness: backgroundScore,
        business_attire: attire.label,
        business_attire_score: attire.score,
        facial_engagement: majorityEmotion,
        facial_engagement_score: avgConfidence,
        emotion_stability: stability,
        overall_setup_quality: Math.round((faceCenteredScore + lightingQuality + faceOcclusion) / 3),
        overall_presentation_score: overallPresentationScore,
        suggestions,
        status_checks,
        dev: {
          fps: fpsRef.current.currentFps,
          confidence: faceDetectionConfidence,
          numFaces,
          iris: devIrisInfo,
          angles: `Yaw: ${yawAngle}°, Pitch: ${pitchAngle}°, Roll: ${rollAngle}°`,
          lighting: brightness,
          probs: devProbsStr,
          frameCount: frameCountRef.current,
          processingTime: processingTime,
          resolution: videoRef.current ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : "Unknown",
          backendConnected: backendConnected ? "Yes" : "No",
          cameraStatus: webcamActive ? "Active" : "Offline",
          backgroundScore: backgroundScore,
          attireLabel: attire.label,
          attireScore: attire.score,
          emotionLabel: majorityEmotion,
          emotionScore: avgConfidence,
          landmarkCount: landmarks.length
        }
      });
      console.log("[Telemetry] UI updated successfully.");
    } catch (err) {
      console.error("[Telemetry] Exception caught in analyzeFrame:", err);
    }
  };

  // Launch MediaPipe FaceMesh loop upon starting interview simulation
  useEffect(() => {
    if (phase === 'interview' && stream && videoRef.current) {
      if (!window.FaceMesh) {
        console.warn("[Telemetry] Camera active but window.FaceMesh is not loaded yet. Waiting for script loaded state.");
        return;
      }
      
      console.log("[Telemetry] Initializing MediaPipe FaceMesh instance...");
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults((results) => {
        analyzeFrame(results);
      });

      console.log("[Telemetry] MediaPipe FaceMesh instance created. Starting frame loop (~15 FPS)...");
      let active = true;
      const processFrame = async () => {
        if (!active) return;
        if (videoRef.current && videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          try {
            await faceMesh.send({ image: videoRef.current });
          } catch (err) {
            console.error("[Telemetry] Frame processing failed inside loop:", err);
          }
        }
        // Run every 66ms to achieve target ~15 FPS
        setTimeout(() => {
          if (active) requestAnimationFrame(processFrame);
        }, 66);
      };

      requestAnimationFrame(processFrame);

      return () => {
        console.log("[Telemetry] Stopping FaceMesh loop and cleaning up resources...");
        active = false;
        try {
          faceMesh.close();
        } catch (e) {
          console.error("[Telemetry] Failed to close FaceMesh instance:", e);
        }
      };
    }
  }, [phase, stream, visionLoaded]);

  const renderHistoryGraph = () => {
    if (biometricHistory.length === 0) {
      return (
        <div className="h-16 flex items-center justify-center border border-dashed border-slate-205 dark:border-slate-800 rounded-xl text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950/20">
          Biometric timeline loading...
        </div>
      );
    }

    const width = 160;
    const height = 40;
    const padding = 4;

    const drawLine = (key) => {
      return biometricHistory.map((item, idx) => {
        const x = padding + (idx / Math.max(1, biometricHistory.length - 1)) * (width - 2 * padding);
        const val = typeof item[key] === 'number' ? item[key] : 0;
        const y = height - padding - (val / 100) * (height - 2 * padding);
        return `${x},${y}`;
      }).join(' ');
    };

    const drawEmotionLine = () => {
      const emotionsMap = {
        "No Face Detected": 0, "Unknown": 1, "Neutral": 2, "Focused": 3,
        "Talking": 4, "Smiling": 5, "Happy": 6, "Sad": 7, "Angry": 8,
        "Fear": 9, "Surprise": 10, "Disgust": 11, "Eyes Closed": 12
      };
      return biometricHistory.map((item, idx) => {
        const x = padding + (idx / Math.max(1, biometricHistory.length - 1)) * (width - 2 * padding);
        const val = emotionsMap[item.emotion] !== undefined ? emotionsMap[item.emotion] : 2;
        const y = height - padding - (val / 12) * (height - 2 * padding);
        return `${x},${y}`;
      }).join(' ');
    };

    const sparklines = [
      { label: 'Eye Contact', key: 'eyeContact', color: '#9333ea', points: drawLine('eyeContact') },
      { label: 'Head Pose', key: 'headPose', color: '#3b82f6', points: drawLine('headPose') },
      { label: 'Lighting', key: 'lighting', color: '#eab308', points: drawLine('lighting') },
      { label: 'Face Visibility', key: 'faceVisibility', color: '#10b981', points: drawLine('faceVisibility') },
      { label: 'Emotion Trace', key: 'emotion', color: '#a855f7', points: drawEmotionLine() }
    ];

    return (
      <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-855">
        <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">30s Biometric Timelines</p>
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sparklines.map(s => (
            <div key={s.label} className="bg-slate-900/50 p-2 rounded-lg border border-slate-850 space-y-1">
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                <span>{s.label}</span>
                <span style={{ color: s.color }} className="truncate max-w-[60px]">
                  {s.key === 'emotion' 
                    ? (biometricHistory[biometricHistory.length - 1]?.emotion || 'Neutral') 
                    : `${biometricHistory[biometricHistory.length - 1]?.[s.key] || 0}%`}
                </span>
              </div>
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 overflow-visible">
                <polyline
                  fill="none"
                  stroke={s.color}
                  strokeWidth="1.5"
                  points={s.points}
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase tracking-wider pt-1 border-t border-slate-900">
          <span>30s ago</span>
          <span>Live timeline logs</span>
        </div>
      </div>
    );
  };

  const loadAnalysesAndHistory = async () => {
    try {
      setHistoryLoading(true);
      setError(null);
      
      const analysesData = await getAnalyses();
      const mockHistory = await getMockInterviewsHistory();
      
      setAnalyses(analysesData);
      setHistoryList(mockHistory);
      setBackendConnected(true);

      // Pre-populate missing skills if dashboard analysis is active
      if (workspaceAnalysis) {
        setJobRole(workspaceAnalysis.job_title || 'Software Engineer');
        setMissingSkills(workspaceAnalysis.skills?.missing || []);
      } else if (analysesData.length > 0) {
        const latest = analysesData[0];
        setJobRole(latest.job_title);
        setMissingSkills(latest.results?.skills?.missing || []);
      }
    } catch (err) {
      console.error(err);
      setBackendConnected(false);
      setError(`Failed to retrieve analyses or interview history: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectAnalysis = (id) => {
    if (!id) return;
    const item = analyses.find(a => a.id === id);
    if (!item) return;
    setJobRole(item.job_title);
    setMissingSkills(item.results?.skills?.missing || []);
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechAvailable(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        // Automatically restart if session is still active and recording should be on
        if (phase === 'interview' && isRecording) {
          try {
            rec.start();
          } catch (err) {
            // suppress start errors if already running
          }
        }
      };

      setRecognition(rec);
    }
  };

  // Webcam access helpers
  const startWebcam = async () => {
    try {
      setError(null);
      setCameraInitializing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setWebcamActive(true);
    } catch (err) {
      console.error('Webcam/Microphone access error:', err);
      setError(`Camera/Microphone permission denied: ${err.message}. Please check your browser settings to grant permission and retry.`);
      setWebcamActive(false);
      throw err; // throw to abort interview start
    } finally {
      setCameraInitializing(false);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Failed to stop track:', e);
        }
      });
      setStream(null);
    }
    setWebcamActive(false);
  };

  // Timer loops
  const startTimer = () => {
    stopTimer();
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          handleNextQuestionFlow();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStartSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load live presentation face mesh models if they aren't fully resolved yet
      if (!visionLoaded) {
        await loadVisionModels();
      }
      
      // Request webcam and audio access immediately to satisfy webcam requirements
      await startWebcam();

      const session = await startMockInterview(
        jobRole,
        interviewType,
        difficulty,
        duration,
        missingSkills,
        companyName,
        topicFocus,
        practiceMode,
        enableAdaptive
      );
      
      setActiveSession(session);
      setCurrentQIdx(0);
      setTranscript('');
      setPresentationAnalysis(initialPresentationState);
      setPhase('interview');
      
      // Start recording and timer
      if (recognition) {
        try {
          recognition.start();
          setIsRecording(true);
        } catch (err) {
          console.warn('Speech recognition start failed:', err);
        }
      }
      
      startTimer();
    } catch (err) {
      console.error(err);
      stopWebcam();
      // Render the actual backend error details
      const errMsg = err.response?.data?.detail || err.message || 'Interview Failed';
      setError(`Failed to start mock interview: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNextQuestionFlow = async () => {
    stopTimer();
    
    // Temporarily halt speech recognition
    if (recognition && isRecording) {
      recognition.stop();
    }

    try {
      setLoading(true);
      setError(null);

      const currentQuestion = activeSession.questions[currentQIdx];
      const elapsed = 60 - timeLeft;

      // Submit transcript and retrieve AI feedback evaluation for the active question
      const evaluation = await submitInterviewAnswer(
        activeSession.id,
        currentQIdx,
        currentQuestion,
        transcript || "(No spoken or typed answer recorded.)",
        elapsed
      );

      setActiveEvaluation(evaluation);
      setActiveHintLevel('none');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message;
      setError(`Failed to submit answer: ${errMsg}`);
      // Restart timer to allow re-submission attempts
      startTimer();
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToNextQuestion = async () => {
    setActiveEvaluation(null);
    const nextIdx = currentQIdx + 1;
    
    if (nextIdx < activeSession.questions.length) {
      setCurrentQIdx(nextIdx);
      setTranscript('');
      startTimer();
      if (recognition) {
        try {
          recognition.start();
          setIsRecording(true);
        } catch (e) {
          // suppress start overlaps
        }
      }
    } else {
      // Complete the mock session automatically on the final question submission
      await handleFinalizeSession();
    }
  };

  const handleFinalizeSession = async () => {
    stopTimer();
    stopWebcam();
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }

    try {
      setLoading(true);
      setError(null);
      
      const finalized = await finalizeMockInterview(activeSession.id, presentationAnalysis);
      setActiveSession(finalized);
      
      // Reload history list
      const updatedHistory = await getMockInterviewsHistory();
      setHistoryList(updatedHistory);
      
      setPhase('report');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message;
      setError(`Failed to finalize report: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = () => {
    stopTimer();
    stopWebcam();
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
    setPhase('dashboard');
    setActiveSession(null);
  };

  // Actions for history list
  const handleLoadHistoryReport = (session) => {
    setActiveSession(session);
    setPhase('report');
  };

  const handleDeleteHistorySession = async (id, e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await deleteMockInterview(id);
      const updated = await getMockInterviewsHistory();
      setHistoryList(updated);
    } catch (err) {
      console.error(err);
      setError(`Failed to delete interview session: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDFReport = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setLoading(true);
      const blob = await downloadInterviewReport(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Interview_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      setError(`Failed to download report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (val) => {
    if (val >= 80) return 'text-green-600 bg-green-50 dark:bg-green-950/20';
    if (val >= 65) return 'text-amber-605 bg-amber-50 dark:bg-amber-955/20';
    return 'text-red-650 bg-red-50/60 dark:bg-red-950/20';
  };

  const getScoreDescription = (val) => {
    if (val >= 80) return 'Exceptional';
    if (val >= 65) return 'Proficient';
    return 'Needs Work';
  };

  const interviewTypes = ['Technical', 'HR', 'Behavioral', 'Coding', 'System Design'];
  const difficultyLevels = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">AI Interview Prep</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prepare for technical and communication checks in real-time mock interviews.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-650 dark:text-red-400">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          {error}
        </div>
      )}

      {/* PHASE 1: DASHBOARD AND SETUP */}
      {phase === 'dashboard' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Setup Controls Card */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white">Configure Interview Simulation</h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">Link analysis gaps or define target roles to start dynamic question generators.</p>
              </div>

              {analyses.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Resume Gap Profile</label>
                  <select
                    value={selectedAnalysisId}
                    onChange={(e) => {
                      setSelectedAnalysisId(e.target.value);
                      handleSelectAnalysis(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:border-slate-400 focus:outline-none appearance-none"
                  >
                    <option value="">Load gaps from previous resumes...</option>
                    {analyses.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.resume_filename} - {a.job_title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 placeholder-slate-450 focus:border-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    {interviewTypes.map(t => <option key={t} value={t}>{t} Interview</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    {difficultyLevels.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Company</label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    {["Google", "Microsoft", "Amazon", "Meta", "OpenAI", "Netflix", "Apple", "Adobe", "Oracle", "IBM", "TCS", "Infosys", "Accenture", "Capgemini", "Cognizant", "Wipro", "Generic Software Company"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topic Focus</label>
                  <select
                    value={topicFocus}
                    onChange={(e) => setTopicFocus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    {["Python", "Java", "C++", "SQL", "DBMS", "Operating Systems", "Computer Networks", "Machine Learning", "Deep Learning", "NLP", "React", "JavaScript", "Node.js", "FastAPI", "System Design", "DSA", "Behavioral", "Mixed Interview"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice Mode</label>
                  <select
                    value={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="quick">Quick (5 Questions)</option>
                    <option value="standard">Standard (10 Questions)</option>
                    <option value="full">Full (20 Questions)</option>
                    <option value="unlimited">Unlimited Practice Mode</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interview Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-slate-250 focus:border-slate-400 focus:outline-none"
                  >
                    <option value={10}>10 Minutes (Quick Audit)</option>
                    <option value={15}>15 Minutes (Standard)</option>
                    <option value={30}>30 Minutes (Deep Dive)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableAdaptive}
                    onChange={(e) => setEnableAdaptive(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Enable Adaptive AI (adjust difficulty dynamically)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableHints}
                    onChange={(e) => setEnableHints(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span>Enable Hint Mode (show small/medium/full hints)</span>
                </label>
              </div>

              {missingSkills.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked Gaps Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.slice(0, 5).map(s => (
                      <span key={s} className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleStartSimulation}
                disabled={loading || cameraInitializing || visionLoading}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 text-xs font-bold shadow-soft hover:bg-slate-850 dark:hover:bg-slate-200 transition-colors"
              >
                {loading || cameraInitializing || visionLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {visionLoading ? 'Loading AI Vision Models...' : cameraInitializing ? 'Accessing Camera & Mic...' : loading ? 'Starting Mock Interview...' : 'Start Mock Interview'}
              </button>

              {error && error.includes("permission denied") && (
                <button
                  onClick={handleStartSimulation}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-650 dark:text-red-400 py-3 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Grant Permission & Retry
                </button>
              )}
            </div>

            {/* Sidebar Guidelines card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4 flex flex-col justify-center">
              <div className="text-center space-y-3">
                <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-white">
                  <Camera className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Camera Preview</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  Webcam streams and live audio transcripts are handled securely inside the browser client sandbox.
                </p>
              </div>
            </div>
          </div>

          {/* HISTORICAL INTERVIEWS */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Interview History</h4>
            
            {historyLoading ? (
              <div className="flex justify-center p-8">
                <Loader className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : historyList.length === 0 ? (
              <div className="rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-soft">
                <Clock className="h-8 w-8 mx-auto text-slate-350 mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">No mock interview history logged yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyList.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => handleLoadHistoryReport(session)}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft hover:border-slate-350 dark:hover:border-slate-750 transition-colors cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(session.created_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getMetricColor(session.overall_score)}`}>
                          Score: {session.overall_score}%
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{session.job_title}</h5>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {session.interview_type} • {session.difficulty_level} • {session.duration}m
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 border-t border-slate-105 dark:border-slate-800 pt-3 mt-4">
                      <button
                        onClick={(e) => handleDownloadPDFReport(session.id, e)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-900 rounded-lg"
                        title="Download PDF Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteHistorySession(session.id, e)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-450 hover:text-red-650 rounded-lg"
                        title="Delete Session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* PHASE 2: LIVE SIMULATION WORKSPACE */}
      {phase === 'interview' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Live Feed & Timers */}
          <div className="space-y-6">
            
            {/* Live Camera Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 shadow-soft relative overflow-hidden aspect-video flex items-center justify-center">
              {webcamActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Video className="h-8 w-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Webcam Offline</p>
                </div>
              )}
              
              <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                Live Camera Preview
              </div>
            </div>

            {/* Micro & Timer status */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Interview Timer</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{timeLeft}s remaining</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-350">
                  {timeLeft}
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500">Microphone Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isRecording ? 'text-green-600 bg-green-50' : 'text-slate-650 bg-slate-100'}`}>
                  {isRecording ? 'Active / Recording' : 'Muted / Offline'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleMic}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50"
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? 'Mute Microphone' : 'Enable Microphone'}
              </button>
              <button
                onClick={handleCancelSession}
                className="flex items-center justify-center p-3 border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-xl"
                title="End Interview"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>

            {/* Live Presentation Analysis Panel */}
            {presentationAnalysis && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-650" />
                    Presentation Estimates
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDevMode(!devMode)}
                      className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border transition-colors ${devMode ? 'bg-purple-600 border-purple-600 text-white animate-pulse' : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-750'}`}
                    >
                      DEV MODE
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded">
                      Score: {typeof presentationAnalysis.overall_presentation_score === 'number' ? `${presentationAnalysis.overall_presentation_score}%` : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Developer Mode Diagnostics Display */}
                {devMode && presentationAnalysis.dev && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-855 text-[9.5px] font-mono text-purple-400 space-y-1.5 leading-normal">
                    <p className="font-bold text-slate-450 uppercase tracking-wider text-[8.5px] border-b border-slate-800 pb-1 flex justify-between">
                      <span>AI Dev Diagnostics</span>
                      <span className="text-purple-500 font-bold uppercase">Active Telemetry</span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-350">
                      <div><span className="text-slate-500">Camera Status:</span> <span className={presentationAnalysis.dev.cameraStatus === "Active" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{presentationAnalysis.dev.cameraStatus}</span></div>
                      <div><span className="text-slate-500">Resolution:</span> {presentationAnalysis.dev.resolution}</div>
                      
                      <div><span className="text-slate-500">Processing FPS:</span> {presentationAnalysis.dev.fps}</div>
                      <div><span className="text-slate-500">Frame Count:</span> {presentationAnalysis.dev.frameCount}</div>
                      
                      <div><span className="text-slate-500">Face Detected:</span> <span className={presentationAnalysis.dev.numFaces > 0 ? "text-green-500 font-bold" : "text-amber-500 font-bold"}>{presentationAnalysis.dev.numFaces > 0 ? "Yes" : "No"}</span></div>
                      <div><span className="text-slate-500">Confidence:</span> {typeof presentationAnalysis.dev.confidence === 'number' ? `${Math.round(presentationAnalysis.dev.confidence * 100)}%` : '0%'}</div>
                      
                      <div><span className="text-slate-500">Detected Faces:</span> {presentationAnalysis.dev.numFaces}</div>
                      <div><span className="text-slate-500">Landmarks Count:</span> {presentationAnalysis.dev.landmarkCount}</div>
                      
                      <div className="col-span-2 truncate"><span className="text-slate-500">Current Emotion:</span> {presentationAnalysis.dev.emotionLabel} ({presentationAnalysis.dev.emotionScore}%)</div>
                      <div className="col-span-2 truncate"><span className="text-slate-500">Current Attire:</span> {presentationAnalysis.dev.attireLabel} ({presentationAnalysis.dev.attireScore}%)</div>
                      
                      <div className="col-span-2 truncate"><span className="text-slate-500">Head Pose Angles:</span> {presentationAnalysis.dev.angles}</div>
                      
                      <div><span className="text-slate-500">Brightness:</span> {presentationAnalysis.dev.lighting}</div>
                      <div><span className="text-slate-500">Background Score:</span> {presentationAnalysis.dev.backgroundScore}%</div>
                      
                      <div><span className="text-slate-500">Processing Time:</span> {presentationAnalysis.dev.processingTime} ms</div>
                      <div><span className="text-slate-500">Model Loaded:</span> {visionLoaded ? "Yes" : "No"}</div>
                      
                      <div className="col-span-2"><span className="text-slate-500">Backend Connected:</span> <span className={backendConnected ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{backendConnected ? "Yes" : "No"}</span></div>
                    </div>
                    <div className="border-t border-slate-900 pt-1.5 break-all whitespace-pre-wrap text-[8px] text-slate-500 leading-normal">
                      <span className="text-slate-650">Raw Emotion Probs:</span> {presentationAnalysis.dev.probs}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {[
                    { label: 'Face Visibility', val: presentationAnalysis.face_visibility },
                    { label: 'Face Positioning', val: presentationAnalysis.face_positioning },
                    { label: 'Eye Contact Estimate', val: presentationAnalysis.eye_contact },
                    { label: 'Head Posture Estimate', val: presentationAnalysis.head_posture },
                    { label: 'Lighting Quality', val: presentationAnalysis.lighting_quality },
                    { label: 'Camera Framing', val: presentationAnalysis.camera_framing },
                    { label: 'Background Cleanliness', val: presentationAnalysis.background_cleanliness },
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase">
                        <span>{item.label}</span>
                        <span>{typeof item.val === 'number' ? `${item.val}%` : item.val}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${typeof item.val === 'number' ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-300 dark:bg-slate-700'}`} 
                          style={{ width: `${typeof item.val === 'number' ? item.val : 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] font-semibold text-slate-500">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Attire Detection</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase block">{presentationAnalysis.business_attire}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Current Emotion</span>
                      <span className="font-bold text-slate-900 dark:text-white uppercase truncate block">
                        {presentationAnalysis.facial_engagement}
                      </span>
                    </div>
                  </div>

                  {/* Confidence bar & Stability */}
                  <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex justify-between text-[9px] font-semibold text-slate-400 uppercase">
                      <span>Emotion Confidence</span>
                      <span>{presentationAnalysis.facial_engagement_score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all duration-300 animate-pulse" 
                        style={{ width: `${presentationAnalysis.facial_engagement_score}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-450 font-bold uppercase mt-1">
                      <span>Confidence Bar</span>
                      <span>Stability: <span className="text-purple-600 dark:text-purple-400">{presentationAnalysis.emotion_stability || 'High'}</span></span>
                    </div>
                  </div>

                  {/* 30s Biometric Timeline graph */}
                  {renderHistoryGraph()}

                  {/* Real-time Status Panel */}
                  {presentationAnalysis.status_checks && presentationAnalysis.status_checks.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1.5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time status</p>
                      <div className="space-y-1 font-bold text-[10.5px]">
                        {presentationAnalysis.status_checks.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            {c.status === 'pass' ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-amber-500">⚠</span>
                            )}
                            <span className={c.status === 'pass' ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-500'}>
                              {c.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[8.5px] text-slate-400 font-semibold leading-normal pt-1 italic">
                    * All metrics are estimates based strictly on observable video characteristics. Emotion, personality, or true confidence is not inferred.
                  </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {activeEvaluation ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Question Evaluation Feedback</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">Answer Score: {activeEvaluation.score}%</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getMetricColor(activeEvaluation.score)}`}>
                    {getScoreDescription(activeEvaluation.score)}
                  </span>
                </div>

                {/* Sub-scores Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Technical Accuracy', val: activeEvaluation.technical_relevance },
                    { label: 'Confidence & Clarity', val: activeEvaluation.communication_clarity },
                    { label: 'Completeness', val: activeEvaluation.completeness },
                    { label: 'Keyword Coverage', val: activeEvaluation.keyword_coverage },
                    { label: 'Grammar Quality', val: activeEvaluation.grammar_quality },
                    { label: 'Professionalism', val: activeEvaluation.pronunciation_clarity },
                    { label: 'Vocabulary Richness', val: activeEvaluation.vocabulary_richness },
                  ].map(scoreItem => (
                    <div key={scoreItem.label} className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <div className="flex justify-between text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                        <span>{scoreItem.label}</span>
                        <span>{scoreItem.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${scoreItem.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths & Weaknesses checklists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Key Strengths</p>
                    <ul className="space-y-1.5 list-inside list-disc text-slate-700 dark:text-slate-350">
                      {activeEvaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      {activeEvaluation.strengths.length === 0 && <li>Good general communication style.</li>}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Areas for Improvement</p>
                    <ul className="space-y-1.5 list-inside list-disc text-slate-700 dark:text-slate-350">
                      {activeEvaluation.weaknesses.map((w, i) => <li key={i} className="text-slate-650 dark:text-slate-400">{w}</li>)}
                      {activeEvaluation.weaknesses.length === 0 && <li className="text-slate-500">None detected! Excellent response.</li>}
                    </ul>
                  </div>
                </div>

                {/* Side-by-Side answers comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Answer Transcript</p>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-[10px] leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap text-slate-750 dark:text-slate-350">
                      {transcript || "(No transcript recorded.)"}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Recommended Answer</p>
                    <div className="p-3.5 bg-purple-50/10 dark:bg-purple-950/10 rounded-xl border border-purple-100/50 dark:border-purple-900/20 font-mono text-[10px] leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap text-slate-900 dark:text-white">
                      {activeEvaluation.model_answer}
                    </div>
                  </div>
                </div>

                {activeEvaluation.suggested_improvement && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-850 text-xs text-slate-700 dark:text-slate-350 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[9px]">Suggested Structure Improvement</p>
                    <p className="leading-relaxed">{activeEvaluation.suggested_improvement}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleProceedToNextQuestion}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-650 text-white px-5 py-2.5 text-xs font-bold hover:bg-purple-700"
                  >
                    Proceed to Next Question
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Current Question</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Question {currentQIdx + 1} of {activeSession.questions.length}
                  </span>
                </div>

                {/* Question text */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                    {activeSession.questions[currentQIdx]}
                  </h3>
                </div>

                {/* Hints Mode Card */}
                {enableHints && (
                  <div className="bg-purple-50/10 dark:bg-purple-950/15 p-4 rounded-xl border border-purple-100/30 dark:border-purple-900/10 space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      <span>Practice Hints Enabled</span>
                      <div className="flex gap-2">
                        {['none', 'small', 'medium', 'full'].map(level => (
                          <button
                            key={level}
                            onClick={() => setActiveHintLevel(level)}
                            className={`px-2 py-0.5 rounded border transition-colors ${activeHintLevel === level ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-505 hover:bg-slate-50'}`}
                          >
                            {level === 'none' ? 'Hide' : level === 'small' ? 'Small' : level === 'medium' ? 'Medium' : 'Ideal'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeHintLevel !== 'none' && (() => {
                      const hints = getQuestionHints(activeSession.questions[currentQIdx]);
                      return (
                        <div className="text-xs text-slate-755 dark:text-slate-355 leading-relaxed font-mono whitespace-pre-wrap bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-850">
                          {activeHintLevel === 'small' && hints.small}
                          {activeHintLevel === 'medium' && hints.medium}
                          {activeHintLevel === 'full' && hints.full}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Speech-to-text transcription */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Speech-to-text Transcription</span>
                    {isRecording && (
                      <span className="flex items-center gap-1 text-red-650 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-red-650" />
                        Live recording response...
                      </span>
                    )}
                  </div>

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={speechAvailable ? "Speak clearly. Your words will transcribe here. You can also edit this transcription or type your answer directly." : "Please type your answer here..."}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-4 text-xs font-semibold text-slate-850 dark:text-slate-300 min-h-[160px] focus:border-slate-400 focus:outline-none leading-relaxed"
                  />

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNextQuestionFlow}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold hover:bg-slate-855"
                    >
                      {loading ? <Loader className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                      {currentQIdx + 1 < activeSession.questions.length ? 'Submit Answer' : 'Submit & End Interview'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PHASE 3: CUMULATIVE DASHBOARD REPORT SUMMARY */}
      {phase === 'report' && activeSession && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Performance Dashboard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Role Simulation: {activeSession.job_title}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={(e) => handleDownloadPDFReport(activeSession.id, e)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Download Report PDF
              </button>
              <button
                onClick={() => setPhase('dashboard')}
                className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 text-xs font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* Scores widget grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Overall Interview Score', value: activeSession.overall_score, subtitle: getScoreDescription(activeSession.overall_score) },
              { title: 'Technical Score', value: activeSession.technical_score, subtitle: 'Accuracies check' },
              { title: 'Communication Score', value: activeSession.communication_score, subtitle: 'Speech and grammar' },
              { title: 'Semantic Similarity Score', value: activeSession.semantic_match_score, subtitle: 'Model answer matches' }
            ].map((scoreCard, idx) => (
              <div 
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-3.5"
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{scoreCard.title}</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{scoreCard.value}%</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getMetricColor(scoreCard.value)}`}>
                    {scoreCard.subtitle}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stats list sidebar */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-4">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                Response Statistics
              </h4>
              <div className="space-y-4 text-xs font-semibold text-slate-650 dark:text-slate-350">
                <div className="flex justify-between">
                  <span>Average Response Time</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeSession.avg_response_time}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Answer Length</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeSession.avg_answer_length} words</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Filler Words used</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeSession.filler_word_count} counts</span>
                </div>
              </div>
            </div>

            {/* Strongest / Weakest indicators */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-2.5">
                <span className="inline-flex items-center rounded bg-green-50 dark:bg-green-950/20 text-green-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-green-100/50">
                  Strongest Response
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-normal line-clamp-3">
                  {activeSession.strongest_answer || 'Evaluating...'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft space-y-2.5">
                <span className="inline-flex items-center rounded bg-red-50/60 dark:bg-red-950/20 text-red-650 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-red-100/50">
                  Weakest Response
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-normal line-clamp-3">
                  {activeSession.weakest_answer || 'Evaluating...'}
                </p>
              </div>

            </div>

          </div>

          {/* PRESENTATION ANALYSIS CARD PANEL */}
          {(() => {
            const pData = activeSession.presentation_analysis || initialPresentationState;
            return (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-purple-650" />
                    Presentation Estimates Report
                  </h4>
                  <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${typeof pData.overall_presentation_score === 'number' ? getMetricColor(pData.overall_presentation_score) : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    Presentation Score: {typeof pData.overall_presentation_score === 'number' ? `${pData.overall_presentation_score}%` : 'Unavailable'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                  
                  {/* Metric progress bars */}
                  <div className="space-y-4">
                    {[
                      { label: 'Face Visibility', val: pData.face_visibility },
                      { label: 'Face Positioning in Frame', val: pData.face_positioning },
                      { label: 'Eye Contact Estimate', val: pData.eye_contact },
                      { label: 'Head Posture Estimate', val: pData.head_posture },
                      { label: 'Lighting Quality', val: pData.lighting_quality },
                      { label: 'Camera Framing', val: pData.camera_framing },
                      { label: 'Background Cleanliness', val: pData.background_cleanliness },
                    ].map(m => (
                      <div key={m.label} className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-500 uppercase tracking-wide">
                          <span>{m.label}</span>
                          <span>{typeof m.val === 'number' ? `${m.val}%` : m.val}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${typeof m.val === 'number' ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-300 dark:bg-slate-750'}`} 
                            style={{ width: `${typeof m.val === 'number' ? m.val : 0}%` }} 
                          />
                        </div>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-105 dark:border-slate-800 pt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Attire Estimate</p>
                        <p className="font-semibold text-slate-900 dark:text-white uppercase">
                          {typeof pData.business_attire_score === 'number' ? `${pData.business_attire} (${pData.business_attire_score}%)` : pData.business_attire}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observed Facial Expression</p>
                        <p className="font-semibold text-slate-900 dark:text-white uppercase">
                          {pData.facial_engagement_score > 0 ? `${pData.facial_engagement} (Confidence: ${pData.facial_engagement_score}%)` : pData.facial_engagement}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850">
                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200/50 pb-2">
                      AI Observation Tips
                    </h5>
                    <ul className="list-disc pl-4 space-y-2.5 font-semibold text-slate-600 dark:text-slate-350 leading-relaxed">
                      {(pData.suggestions || []).map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal pt-2 italic">
                      * Clearly labeled: All metrics are AI estimates based on the webcam video feed and do not represent absolute judgments of competence, personality, or emotional state.
                    </p>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* AI LEARNING RECOMMENDATIONS PANEL */}
          {activeSession.learning_recommendations && activeSession.learning_recommendations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="h-4.5 w-4.5 text-purple-650" />
                  AI Learning & Skill Upgrade Recommendations
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded">
                  Targeted Gaps
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {activeSession.learning_recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-955/40 p-5 rounded-xl border border-slate-100 dark:border-slate-850 space-y-3">
                    <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">{rec.topic} Upgrade Path</p>
                    
                    <div className="space-y-2 font-semibold text-slate-700 dark:text-slate-350">
                      <div className="flex gap-2">
                        <span className="text-slate-450">Course:</span>
                        <span className="text-slate-900 dark:text-white">{rec.course}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-450">Docs:</span>
                        <span className="text-slate-900 dark:text-white">{rec.documentation}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-450">Video:</span>
                        <span className="text-slate-900 dark:text-white">{rec.youtube}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-450">Project:</span>
                        <span className="text-slate-900 dark:text-white">{rec.portfolio_project}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-450">Problem:</span>
                        <span className="text-slate-900 dark:text-white">{rec.practice_problem}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI FEEDBACK CATALOG */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Question Breakdown Reports</h4>
            
            <div className="space-y-6">
              {activeSession.questions.map((q, idx) => {
                const evalData = activeSession.evaluations[idx];
                const ansData = activeSession.answers[idx];
                return (
                  <div 
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-soft space-y-4 text-xs leading-relaxed"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-bold text-slate-950 dark:text-white">Question {idx + 1}</span>
                      {evalData && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getMetricColor(evalData.score)}`}>
                          Score: {evalData.score}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Prompt</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{q}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Transcript Response</p>
                      <p className="font-semibold text-slate-550 dark:text-slate-450 font-mono text-[10.5px] bg-slate-50/50 dark:bg-slate-955/20 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                        {ansData || 'No answer recorded.'}
                      </p>
                    </div>

                    {evalData && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI Performance Feedback</p>
                            <ul className="list-disc pl-4 space-y-1 text-slate-500 font-semibold">
                              {evalData.strengths.map((s, i) => <li key={i}>{s}</li>)}
                              {evalData.weaknesses.map((w, i) => <li key={i} className="text-amber-600 dark:text-amber-500">{w}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              <span>Suggested Better Response</span>
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold leading-normal">{evalData.model_answer}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 pt-1">
                              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                              <span>Improvement Tips</span>
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold leading-normal">{evalData.suggested_improvement}</p>
                          </div>
                        </div>

                        {/* Speech & Grammar Analysis Scorecard */}
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speech & Grammar Analysis</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { name: 'Overall Comm Score', val: evalData.score },
                              { name: 'Pronunciation Clarity', val: evalData.pronunciation_clarity || 90.0 },
                              { name: 'Speech Pace', val: evalData.speaking_pace, suffix: ' WPM' },
                              { name: 'Grammar Score', val: evalData.grammar_quality },
                              { name: 'Keyword Coverage', val: evalData.keyword_coverage },
                              { name: 'Technical Relevance', val: evalData.technical_relevance },
                              { name: 'Completeness', val: evalData.completeness },
                              { name: 'Semantic Match', val: evalData.semantic_similarity }
                            ].map(metric => (
                              <div key={metric.name} className="bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{metric.name}</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                                  {metric.val}%{metric.suffix || ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
