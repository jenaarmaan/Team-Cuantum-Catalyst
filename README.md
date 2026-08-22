# NYASA — Evidence-Based Media & Claim Verification Intelligence

> **NYASA doesn't tell you what to believe. It shows you why something may or may not deserve your trust.**

## Track: TRUST — Can you know what's real?

NYASA is an evidence-first verification platform that helps ordinary users evaluate suspicious digital content by combining multimodal AI analysis, source signals, contextual evidence, and explicit uncertainty.

**NYASA never returns TRUE/FALSE.** Every assessment includes evidence, confidence, and uncertainty.

## Architecture

```
                     IMAGE + CLAIM
                           │
                           ▼
                 ┌─────────────────┐
                 │ CLAIM EXTRACTION │
                 │      Gemini     │
                 └────────┬────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      ┌──────────────┐         ┌────────────────┐
      │ MEDIA        │         │ WEB EVIDENCE   │
      │ ANALYSIS     │         │ RETRIEVAL      │
      │ Gemini Vision│         │ Tavily         │
      └──────┬───────┘         └───────┬────────┘
             │                         │
             ▼                         ▼
      MEDIA SIGNALS              EVIDENCE
             │                         │
             └────────────┬────────────┘
                          ▼
                 EVIDENCE CORRELATION
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          SUPPORTS     CONFLICTS     UNKNOWN
             └────────────┼────────────┘
                          ▼
                   SIGNAL FUSION
                          │
                  ┌───────┴───────┐
                  ▼               ▼
              CONFIDENCE      UNCERTAINTY
                  │               │
                  └───────┬───────┘
                          ▼
                 GROUNDED EXPLANATION
                          │
                          ▼
                    NYASA REPORT
```

## Key Differentiator

NYASA separately evaluates:
- **Media Authenticity** — Is the media itself manipulated/synthetic?
- **Context Consistency** — Does the claim match what the media actually shows?
- **Provenance Signals** — Can we trace the origin or earlier occurrences?

An authentic photo from 2019 claimed as "today's event" → Media: ✅ Authentic, Context: ❌ Inconsistent

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| AI/Vision | Google Gemini 2.0 Flash |
| Evidence | Tavily Search API |

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API keys:
#   GEMINI_API_KEY=your_key
#   TAVILY_API_KEY=your_key
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on port 8000.

## API

### POST /api/v1/verify

Submit content for verification.

**Request** (multipart/form-data):
- `claim` (string, required): The claim to verify
- `image` (file, optional): Image to analyze

**Response**: Complete NYASA verification report with:
- Extracted claim
- Media analysis (authenticity + context consistency)
- Evidence items (supporting, contradicting, contextual)
- NYASA Confidence Score
- Structured uncertainty
- Evidence-grounded explanation
- Recommended action

## Team

Team Cuantum Catalyst
