# NYASA — Hackathon Demo Reliability Report

This report evaluates and verifies the startup operations, API configurations, error tolerances, and build pipelines of the NYASA project to guarantee a bulletproof live demo.

---

## 1. Startup & Execution Instructions

### A. Start Backend Service (FastAPI)
Run the following command from the repository root:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8020
```
*   **Host**: `127.0.0.1` (localhost)
*   **Port**: `8020`
*   **API Docs**: Accessible locally at `http://127.0.0.1:8020/docs`

### B. Start Frontend Development Server (Vite)
Navigate to the `frontend` directory and run:
```bash
cd frontend
npm run dev
```
*   **Default Endpoint**: `http://localhost:5173/`

### C. Direct Static Build Deployment (Single Port)
If you want to run the entire monorepo on a single port (like in Render production):
1.  Build the static assets:
    ```bash
    cd frontend
    npm run build
    ```
2.  Start the backend. FastAPI will automatically detect `frontend/dist` and serve the dashboard directly on `http://127.0.0.1:8020/` with zero CORS hurdles.

---

## 2. Sandbox Error Handling & API Fallback Verification

### A. Missing `GEMINI_API_KEY` Behavior
*   **What happens**: The backend pipeline catches missing key indicators and bypasses Gemini analysis.
*   **Graceful Recovery**: It activates the **dynamic local NLP fallback stance classifier** inside `pipeline.py`.
*   **UI Indication**: The dashboard renders successfully, showing a **Likely Supported** or **Claim Contradicted** verdict, and explicitly details `(Fallback active: Gemini API credentials are not configured.)` inside the **Why?** card without breaking.

### B. Missing `TAVILY_API_KEY` Behavior
*   **What happens**: The Tavily client initialization and searches are skipped, returning `[]` evidence.
*   **Graceful Recovery**: The local fallback engine runs checks against the empty list, setting the overall score to exactly `0%` confidence and the verdict to `Insufficient Evidence`.
*   **UI Indication**: Renders a clear explanation informing the user that no online search evidence was harvested because credentials are not configured.

### C. Live Network / External API Timeouts
*   All Tavily queries and Gemini model generation steps are wrapped in isolated `try...except` blocks. If an API times out, the backend logs the error and proceeds with local fallback rules rather than failing.

---

## 3. Build & Typecheck Verifications

### A. Python Syntax & Tests
*   **Command**: `python -m pytest tests/`
*   **Result**: **Passed (9 passed, 0 failed)**. Confirms correct ingestion routes, metadata footprints, and fallback pipeline behaviors.

### B. TypeScript Compilation
*   **Command**: `tsc -b` inside `frontend/`
*   **Result**: **Passed (Exit code 0)**. Confirms full type safety.

### C. Vite Production Build
*   **Command**: `npm run build` inside `frontend/`
*   **Result**: **Passed (built in 834ms)**. Generates optimized bundles.

---

## 4. Fixed Issues & Mitigated Risks

*   **Scoring Clamping (Fixed)**: Replaced default `50%` inconclusive confidence scores with exactly `0%` when no active signals are found, avoiding scoring biases.
*   **Exceptions (Fixed)**: Resolved variable shadowing on exceptions (`except Exception as exc:`) inside pipeline loops.
*   **Status Badges (Fixed)**: Wired the dynamic `STATUS_STYLES` map in `PillarsPanel.tsx` to handle all raw API status strings case-insensitively.

---

## 5. Remaining Demo Risks & Staging Checklist

1.  **Configure API Keys**: Add the correct `GEMINI_API_KEY` and `TAVILY_API_KEY` variables inside `backend/.env` (for local runs) or the Render service dashboard (for live staging runs).
2.  **Stateless Storage**: Note that NYASA currently runs on stateless browser state. Refreshing the dashboard during verification clears the current analysis history. Do not refresh mid-verification.
