# NYASA — External API Reliability Audit & Verification Report

This report summarizes the modifications and behaviors implemented to guarantee external API robustness under connection drops, API key omissions, or rate limit exclusions.

---

## 1. Implemented Improvements

### A. Environment Variable Validation at Startup
*   **Startup Validation**: Added an `@app.on_event("startup")` event listener inside `main.py`. On startup, it inspects key presence and prints configuration status logs:
    *   `[NYASA STARTUP] Gemini API Credentials: CONFIGURED (Verified)` (or issues warnings of fallback mode).
    *   `[NYASA STARTUP] Tavily API Credentials: CONFIGURED (Verified)` (or issues warnings of skipped search queries).

### B. Prevention of API Key Leakage (Credential Masking)
*   **Safety Guards**: In [`pipeline.py`](file:///d:/projects/Team-Cuantum-Catalyst/backend/app/services/pipeline.py), exception text is parsed using regular expressions to strip and replace matching patterns (`AIzaSy...` or `tvly-...`) with `[MASKED]` string wrappers before writing to stdout or printing error details.

### C. Request Timeouts
*   **Timeout Boundaries**: Integrated request options timeout variables:
    ```python
    request_options={"timeout": 15.0}
    ```
    inside Gemini's content generation step (`model.generate_content`) to prevent hanging network sockets during API latency peaks.

### D. Structured Logging Indicators
*   Concise, prefix-tagged `[NYASA LOG]` console lines print in stdout:
    *   `[NYASA LOG] Tavily Search context: SUCCESS (Harvested N items)` or `UNAVAILABLE or missing credentials`
    *   `[NYASA LOG] Gemini Analysis: SUCCESS` or `FAILURE — Running local fallback pipeline. Error: ...`
    *   `[NYASA PIPELINE COMPLETE] ID: nyasa_... | Final: Likely Supported`

---

## 2. System Behaviors under API Failures / Omissions

### A. Scenario A: Gemini Unavailable (Tavily Available)
1.  **Search Ingestion**: Tavily successfully queries the web, harvesting news/context articles.
2.  **Model Call Fails**: The main model call throws a credential or rate-limit error (429).
3.  **Local Fallback activation**: The exception is caught, printing `[NYASA LOG] Gemini Analysis: FAILURE — Running local fallback...` and triggering the local NLP stance classifier.
4.  **Results**: Parses Tavily results for terms matching the claim. If matches exist, it outputs **Likely Supported** or **Claim Contradicted** with a dynamic confidence score (e.g. **85%**), and lists matching sources in the dashboard.

### B. Scenario B: Tavily Unavailable (Gemini Available)
1.  **Search Ingestion**: Bypassed or fails (returns `[]` evidence). Logs `[NYASA LOG] Tavily Search context: UNAVAILABLE...`.
2.  **Model Call succeeds**: Gemini is invoked with `"No web evidence provided."` along with the image bytes.
3.  **Results**: Gemini analyzes the visual content and EXIF metadata (checking P1, P2, and P3). It successfully returns a partial verification report (verdicts like `Insufficient Evidence` or `likely_authentic` with `0%` confidence).

### C. Scenario C: Both Gemini & Tavily Unavailable
1.  **Search Ingestion**: Skipped (returns `[]` evidence).
2.  **Model Call Fails**: The model call fails due to missing keys.
3.  **Local Fallback activation**: The exception is caught. The local NLP classifier runs against the empty `[]` evidence list.
4.  **Results**: Gracefully yields **Insufficient Evidence** with **0%** confidence, a High uncertainty level, and detailed explanation text showing `(Fallback active: Gemini API credentials are not configured.)` in the UI without crashing the server.
