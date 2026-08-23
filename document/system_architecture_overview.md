# NYASA — Master System Architecture & Codebase Documentation

This document provides a comprehensive, file-by-file technical audit of the NYASA Multi-Signal Media Authenticity and Claim Verification Engine. It traces every line of implementation logic, the data models, local NLP fallbacks, the weighted signal fusion model, and the Material Design 3 responsive dashboard components.

---

## 1. Complete Project Structure & Implementation Details

NYASA is structured as a unified monorepo hosting a FastAPI backend and a Vite+React+TypeScript frontend.

```text
Team-Cuantum-Catalyst/
├── backend/                         # Backend Verification Core (Python + FastAPI)
│   ├── app/
│   │   ├── api/                     # Endpoint router files
│   │   │   └── verification.py      # Verification ingestion, caching, & file diagnostics
│   │   ├── core/                    # Global settings & config
│   │   │   └── config.py            # Environment validation & fallback configurations
│   │   ├── models/                  # Pydantic data schemas
│   │   │   └── schemas.py           # Verification contracts, Pillar Results, & Fusion models
│   │   ├── services/                # Specialized pipeline modules
│   │   │   ├── claim_extractor.py   # Gemini claim parser & entity extraction
│   │   │   ├── media_analyzer.py    # Gemini Vision image authenticity audit
│   │   │   ├── evidence_retriever.py# Tavily search query generator & local NLP parser
│   │   │   ├── evidence_ranker.py   # Gemini Stance classifier & relevance weights
│   │   │   ├── signal_fusion.py     # Signal fusion engine & confidence fallbacks
│   │   │   ├── uncertainty.py       # Analytical uncertainty factor engine
│   │   │   ├── explanation.py       # Gemini-based final report synthesis
│   │   │   └── pipeline.py          # Orchestration pipeline & exception recovery
│   │   └── main.py                  # FastAPI Application Entry & Static router
│   ├── requirements.txt             # Pytest, FastAPI, Uvicorn, Pillow, Pydantic dependencies
│   └── .env                         # Local private environment configurations
│
├── frontend/                        # Interactive Dashboard (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/              # Material 3 UI Components
│   │   │   ├── UploadBox.tsx        # Drag-and-drop media panel & outlined input fields
│   │   │   ├── AnalysisProgress.tsx # Animated SVG loading ring and pipeline trackers
│   │   │   ├── AssessmentCard.tsx   # Top summary grid with final dynamic labels
│   │   │   ├── PillarsPanel.tsx     # Expandable row panel & dynamic badge colors
│   │   │   ├── SourceContextMap.tsx # Leaflet Map with connecting vector drawings
│   │   │   ├── MediaAnalysis.tsx    # Vision audit results and OCR text highlights
│   │   │   ├── EvidenceCard.tsx     # External evidence stance cards with reasoning
│   │   │   ├── UncertaintyPanel.tsx # Uncertainty factor tables and helpful information
│   │   │   ├── ProblemScenario.tsx  # Dynamic EXIF/C2PA re-contextualization decoy card
│   │   │   ├── ComparisonTable.tsx  # SynthID, C2PA, and NYASA comparison grid
│   │   │   ├── PipelineDiagram.tsx  # Responsive pipeline SVG nodes animation
│   │   │   └── ReportFakePage.tsx   # Indian fake news & MHA Cyber Crime reporting portal
│   │   ├── services/                # API connector layer
│   │   │   └── api.ts               # Axios client for verify endpoints
│   │   ├── types/                   # Unified React type interfaces
│   │   │   └── verification.ts
│   │   ├── App.tsx                  # Main router, scrolling narratives & theme selectors
│   │   ├── index.css                # Material 3 styling tokens & Tailwind theme definitions
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
```

---

## 2. Backend Architecture: Detailed File-by-File Breakdown

### A. Core Configuration & Routing
*   **[`main.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/main.py)**:
    *   Initializes the FastAPI application instance.
    *   Sets up CORS middleware targeting local and staging URLs.
    *   Configures a static files router that mounts the built React assets (`frontend/dist`) at the root `/` path, redirecting unmatched routes to `index.html` to support SPA routing.
    *   Injects path modifiers to guarantee module importing validity from any level of the project.
*   **[`core/config.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/core/config.py)**:
    *   Implements a Pydantic `BaseSettings` schema that loads values from `.env` or system environment variables.
    *   Checks for `GEMINI_API_KEY`, `TAVILY_API_KEY`, `GEMINI_MODEL`, and configurations like file size limits.
*   **[`api/verification.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/api/verification.py)**:
    *   Exposes the `POST /api/v1/verify` endpoint.
    *   Handles file ingestion using FastAPI `UploadFile`. It reads the raw file bytes, extracts metadata (EXIF/GPS) using `Pillow`, and checks for C2PA content credential manifests.
    *   Launches the verification pipeline asynchronously.

### B. Specialized Pipeline Services
*   **[`services/pipeline.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/pipeline.py)**:
    *   Acts as the central orchestrator that coordinates data passing between all backend services.
    *   Wraps the Unified Gemini Analysis phase in a robust `try...except` block. If Gemini encounters a rate-limit error (429) or is unconfigured, the pipeline triggers a **dynamic local NLP fallback stance classifier** to parse retrieved search results in real-time, preventing the pipeline from crashing.
*   **[`services/claim_extractor.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/claim_extractor.py)**:
    *   Extracts structured semantic parameters (entities, location, date keywords, event types) from raw claims using Gemini's structured JSON output mode.
    *   Provides fallback values if Gemini is offline, extracting keywords via basic NLP heuristics.
*   **[`services/media_analyzer.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/media_analyzer.py)**:
    *   Passes image bytes and claims to Gemini Vision.
    *   Analyzes lighting continuity, noise profiles, OCR text matches, and flags structural contradictions between the image contents and the claim text.
*   **[`services/evidence_retriever.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/evidence_retriever.py)**:
    *   Constructs search queries from the extracted claim parameters.
    *   Queries the **Tavily API** to harvest live web articles, indexing source names, URLs, snippets, and publication dates.
    *   Features an offline regex-based query parser that extracts entities locally.
*   **[`services/evidence_ranker.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/evidence_ranker.py)**:
    *   Runs stance classification against retrieved web pages, classifying them as `SUPPORTS`, `CONTRADICTS`, `CONTEXT`, or `UNRESOLVED`.
    *   Computes relevance and authority scores.
*   **[`services/signal_fusion.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/signal_fusion.py)**:
    *   Fuses the 6 diagnostic pillars using a weighted signal model:
        $$\text{Confidence} = \frac{\sum (Weight_i \times Score_i)}{\sum Weight_i}$$
    *   Surgically resolves the default 50% score bug: if no active signals are verified, it sets the overall confidence to exactly `0%` rather than introducing a visual bias.
*   **[`services/uncertainty.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/uncertainty.py)**:
    *   Evaluates 8 analytical risk factors (missing EXIF, absent C2PA, conflict, missing context) to assign a High, Moderate, or Low uncertainty index.
*   **[`services/explanation.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/explanation.py)**:
    *   Synthesizes findings, scores, and risk factors into a final summary report containing recommended actions and limitations.

---

## 3. Dynamic Local Fallback Engine

To maintain high availability during Gemini rate limits or connection failures:
1.  **Local Query Parsing**: Extracts location coordinates and search terms locally using regular expressions if structured extraction fails.
2.  **Local NLP Stance Classifier**:
    *   Extracts a unique token set from the claim text.
    *   Iterates through Tavily search results. If a result contains contradiction indicators (`fake`, `debunk`, `false`, `misleading`, `not true`, `fact check`), and shares key terms with the claim, it is classified as `CONTRADICTS`.
    *   If a source has a high term overlap without contradiction indicators, it is classified as `SUPPORTS`.
3.  **Active Signal Propagation**: The locally classified stances drive Pillar P6 (External Context Verification) to `SUPPORTED` or `CONTRADICTED`, allowing `signal_fusion.py` to calculate dynamic scores (e.g. `85%` confidence) dynamically without Gemini.

---

## 4. Frontend Architecture: UI/UX & Style System

The React interface leverages Material Design 3 guidelines to present a professional layout.

### A. Styles & Colors (`index.css`)
*   **Color Tokens**:
    *   `--color-nyasa-primary`: Deep Blue (`#005faf`)
    *   `--color-nyasa-supported`: Emerald Green (`#15803d`)
    *   `--color-nyasa-contradicted`: Crimson Red (`#b91c1c`)
    *   `--color-nyasa-bg`: Sleek Slate Mode (`#f8fafc` Light / `#0f172a` Dark)
*   **M3 Typography Scales**:
    *   `.text-display-large`: Bold, tightly tracked display headers.
    *   `.text-headline-medium`: Standard section headers.
    *   `.text-title-medium` & `.text-title-small`: Expandable row labels.
    *   `.text-body-medium`: Easy-to-read content typography.
*   **Transitions**: Unified `transition-all duration-200 cubic-bezier(0.2, 0, 0, 1)` profiles.

### B. Interactive Components
*   **[`UploadBox.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/UploadBox.tsx)**:
    *   Dynamic drag-and-drop zone with responsive scale-up animations on dragover.
    *   Accepts images, videos, or audio files, generating memory-safe Object URLs for previews.
    *   Textarea features a clear M3 outline ring on focus.
*   **[`PillarsPanel.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/PillarsPanel.tsx)**:
    *   Presents a list of 6 linear expandable parameter rows.
    *   Features a custom [`STATUS_STYLES`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/PillarsPanel.tsx#L18-L30) mapping engine that renders statuses (`UNAVAILABLE`, `UNVERIFIABLE`, `N/A`, `SUPPORTED`, `CONTRADICTED`) in color-coded, border-rounded badges.
*   **[`SourceContextMap.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/SourceContextMap.tsx)**:
    *   Leaflet-based context map rendering a custom-drawn vector connection between a claim's location and contradictory/supporting evidence coordinates.
    *   Popup styling features M3 borders and typography.
*   **[`ReportFakePage.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/ReportFakePage.tsx)**:
    *   India-focused Fake News and Cyber Crime reporting portal.
    *   Lists instructions for PIB Fact Check (WhatsApp: `+91 8799711259`, Email: `socialmedia@pib.gov.in`, Web Portal) and the National Cyber Crime Reporting Portal (`cybercrime.gov.in`).
    *   Includes copy-to-clipboard buttons and stateful return navigation.
*   **[`ProblemScenario.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/ProblemScenario.tsx)**:
    *   Simulates a real-world metadata manipulation scenario (Vande Mataram event in Lahore labeled as Mysuru) to demonstrate why C2PA/EXIF alone are insufficient without context verification.
*   **[`PipelineDiagram.tsx`](file:///d:/projects/Team-Cuantum-Catalyst/frontend/src/components/PipelineDiagram.tsx)**:
    *   Responsive SVG diagram detailing the verification pipeline's steps.
