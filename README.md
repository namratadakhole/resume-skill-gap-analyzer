# Resume Skill Gap Analyzer

An enterprise-grade, full-stack web application designed to analyze candidate resumes (supporting PDF, DOCX, TXT, and scanned image OCR formats) against target job description requirements. Utilizing modern NLP techniques, TF-IDF vectorization, and Cosine Similarity, it calculates semantic alignment scores, identifies skill gaps, checks formatting compliance, and produces dynamic learning paths and downloadable PDF reports.

The UI features a clean, high-contrast, professional slate-and-white aesthetic, interactive Recharts analytics, and Framer Motion transitions.

---

## Features

- **Multi-Format Resume Support**: Upload resumes in PDF, DOCX, TXT, or image (PNG, JPG, JPEG) formats.
- **AI-Powered OCR Engine**: High-fidelity text extraction from resume images using local PyTesseract and Pillow with public API fallbacks.
- **ATS and NLP Semantic Matching**: Calculates sentence-transformer semantic similarities, TF-IDF keyword overlap, formatting score, and experience evaluation.
- **Skill Gap Mapping**: Categorizes skills dynamically into matched, missing, and extra classifications.
- **Actionable Career Pathways**: Generates chronological learning milestones and course recommendations based on identified gaps.
- **Dynamic AI Interview Coach**: Generates unique, non-repeating interview questions mapped to specific resume details, certifications, and experience.
- **Interactive Reports**: Download complete, formatted PDF summaries of the analysis.
- **History & Version Syncing**: Manage multiple resume versions and track historic audits per account.

---

## Tech Stack

### Frontend
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts (Radar, Donut, Circular Gauge)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **API Handler**: Axios

### Backend
- **Core**: FastAPI (Python 3.9+), Uvicorn
- **Database**: MongoDB Atlas (Motor Async Client)
- **NLP & Math**: NLTK (Tokenization, stopword filtering, lemmatization), Scikit-Learn
- **OCR Engine**: PyTesseract, Pillow, Requests
- **Document Parsers**: PyPDF, python-docx
- **Report Generator**: FPDF2
- **Auth**: PyJWT, Bcrypt

---

## Architecture & Database Design

The application utilizes a stateless API architecture communicating with MongoDB Atlas for persistent storage.

```
                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │      (Vite Client)      │
                    └────────────┬────────────┘
                                 │ HTTP / JSON
                                 ▼
                    ┌─────────────────────────┐
                    │     FastAPI Backend     │
                    │        (Uvicorn)        │
                    └────┬───────────────┬────┘
                         │               │
      Pytesseract / OCR  ▼               ▼  Motor (Async Driver)
                   ┌──────────┐     ┌────────────────────────┐
                   │ Document │     │     MongoDB Atlas      │
                   │ Parser   │     │    (Cloud Database)    │
                   └──────────┘     └────────────────────────┘
```

### Collection Schema
- `users`: Credentials, profile settings, and career preferences.
- `resumes`: Metadata, physical storage paths, extracted raw text, and version histories.
- `analyses`: ATS score runs, keyword breakdowns, and matching logs.
- `reports`: Serialized PDF download logs and metrics.
- `mock_interviews`: Session logs, custom questions list, evaluations, and presentation metrics.

---

## Folder Structure

```
resume-skill-gap-analyzer/
├── client/                      # React Frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable UI widgets
│   │   ├── context/             # React Context Providers (Auth, Settings)
│   │   ├── pages/               # Dashboard, Interview Prep, Studio, Settings pages
│   │   ├── services/            # Axios API config
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                      # FastAPI Backend
│   ├── uploads/                 # Uploaded resumes
│   ├── app.py                   # Main API router & startup events
│   ├── database.py              # MongoDB Atlas configuration
│   ├── extractor.py             # OCR & document parsing logic
│   ├── auth.py                  # JWT Auth & Password Hashing
│   ├── crud.py                  # Database CRUD queries
│   ├── schemas.py               # Pydantic data schemas
│   └── requirements.txt         # Backend Python dependencies
├── .env.example                 # Global environment configuration template
└── README.md                    # Project documentation
```

---

## Environment Variables

Create a `.env` file based on the `.env.example` file in the project root:

```env
MONGODB_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_signing_secret_key
VITE_API_BASE_URL=http://localhost:8000
```

---

## Local Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Tesseract OCR (Optional, for local image OCR text extraction)

### 1. Database Setup
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a cluster and database named `resume_analyzer`.
3. Under **Security ➔ Network Access**, whitelist your IP address or add `0.0.0.0/0` (access from anywhere).

### 2. Backend Setup
```bash
cd server
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Run the FastAPI development server:
```bash
uvicorn app:app --reload
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Deployment Guide

### Backend Deployment (Docker/Render/Heroku)
The backend can be built using the standard python environment or containerized:
```dockerfile
FROM python:3.9-slim
RUN apt-get update && apt-get install -y tesseract-ocr
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Deployment (Vercel/Netlify)
Build static production files using:
```bash
npm run build
```
Upload the `client/dist` directory to your static hosting provider, pointing all client-side routing back to `index.html`.

---

## Screenshots

*(Screenshots placeholders)*
- **Dashboard Analysis View**
- **ATS Gauge & KPI Metric Cards**
- **Career Path and Learning Timeline**
- **AI Interview Coach Simulator**

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
