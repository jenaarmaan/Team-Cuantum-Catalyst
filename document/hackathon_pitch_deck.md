# NYASA — Hackathon Pitch Deck (9-Slide Structure)

This document provides the slide outlines, visual layouts, and speaker scripts for presenting NYASA.

---

## Slide 1 — Title

### 1. Slide Contents
*   **Project Name**: NYASA
*   **Tagline**: *"Can You Know What's Real?"*
*   **Value Proposition**: An evidence-fusion verification engine that cross-references file forensics with real-world context to expose re-contextualized media.

### 2. Suggested Visuals
*   Clean, minimalist title layout using a dark background. Center the NYASA logo (a protective shield containing a checkbox) with a subtle blueprint grid overlay.

### 3. Speaker Notes
> "Good afternoon, judges. Today, we present NYASA. We live in a world where we constantly ask: 'Can you know what's real?' Truth isn't binary, and trust shouldn't be either. NYASA is a multi-signal context engine designed to help you evaluate not just whether media has been doctored, but whether it deserves your trust in context."

---

## Slide 2 — Introduction / Case Study

### 1. Slide Contents
*   **The Decoy Dilemma**: A perfectly authentic photograph is used to support a completely fabricated news claim.
*   **Real-world Example**: An unedited photo of street flooding in Lahore from 2023 is posted on social media claiming to show *"heavy floods in Mysuru today."*
*   **The Check**: EXIF and C2PA checks label the file as "authentic" because it contains no edits. However, the *claim* is entirely false.

### 2. Suggested Visuals
*   Side-by-side comparison: On the left, the unedited flood photo labeled "File Authenticity: 100% Valid". On the right, the tweet claiming it is in Mysuru today, marked with a red warning flag: "Location Contradiction: Source traces to Lahore, 2023".

### 3. Speaker Notes
> "Let's look at a common scenario. A user uploads an unedited photo of street floods and tweets: 'Mysuru city is flooding today!' Standard detectors check the file metadata and say: 'This file is authentic and unaltered.' But the claim is a lie. The photo was actually taken years ago in Lahore, Pakistan. This is the re-contextualization gap."

---

## Slide 3 — Problem Statement

### 1. Slide Contents
*   **Doctored Content**: The rise of generative AI and deepfakes makes visual inspection unreliable.
*   **Context Manipulation**: The most common form of misinformation is using real, unedited photos in a false location, time, or event context.
*   **Detector Limitations**: Existing watermarks and file hash checkers only inspect the *file*, ignoring the *context*.
*   **Binary Bias**: True/False detectors force a binary output, whereas real-world validation contains shades of gray and incomplete evidence.

### 2. Suggested Visuals
*   A Venn diagram showing "File Authenticity" (EXIF, Watermarks) and "Contextual Consensus" (Real-world News, Timelines). Misinformation lives in the intersection where the file is authentic but the context is false.

### 3. Speaker Notes
> "Watermarking and metadata tracking are step-one safeguards, but they leave a massive loophole. Misinformation doesn't just happen through Photoshop or deepfakes; it happens by misrepresenting real photos. Furthermore, binary 'True/False' detectors are misleading. Real verification requires assessing evidence, confidence, and uncertainty together."

---

## Slide 4 — The Solution: NYASA

### 1. Slide Contents
*   **Multi-Signal Ingestion**: Fuses media diagnostics with real-time web consensus audits.
*   **Non-Binary Assessment**: Replaces binary labels with nuanced verdicts (e.g. *Likely Supported*, *Likely Misleading*, *Insufficient Evidence*).
*   **Visualizing Uncertainty**: Explicitly exposes risk factors (missing EXIF, conflicting sources) to show what remains unknown.
*   **The Six Pillars**: A modular, multi-dimensional framework evaluating the file and claim.

### 2. Suggested Visuals
*   A graphic showing three output metrics: **Confidence Score** (weighted agreement), **Evidence Credibility Score (ECS)** (quality index), and **Uncertainty Level** (amber/red warning indicator).

### 3. Speaker Notes
> "NYASA addresses this gap. Instead of returning a binary 'True' or 'False', it evaluates the submission against six independent pillars. It calculates a weighted Confidence Score, maps an Evidence Credibility Score showing the quality of the underlying sources, and displays an Uncertainty Level to warn the user of missing details."

---

## Slide 5 — Features & USP

### 1. Slide Contents
*   **Authenticity vs. Consistency**: Separates *image manipulation check* (Pillar 3) from *context consistency check* (Pillar 6).
*   **Evidence Credibility Score (ECS)**: Evaluates source independence, coverage, domain diversity, and signal consensus.
*   **Dynamic Local NLP Fallback**: If LLM API limits are hit, a local token classifier parses search stances in real-time, preventing crashes.
*   **Indian Misinformation Portal (🇮🇳)**: Offers a path to report fake news to PIB Fact Check and the National Cyber Crime portal.

### 2. Suggested Visuals
*   A clean grid showing the 4 core USPs: "Authenticity != Context", "Source Stance NLP Classifier", "ECS Index", and "Helplines Guide".

### 3. Speaker Notes
> "Our key differentiator is separating image authenticity from context consistency. We also evaluate the independence and quality of sources using our ECS formula. And during high-traffic hackathon runs, if API quotas are exceeded, our local NLP fallback engine takes over to analyze search stances in real-time."

---

## Slide 6 — Process Flow

### 1. Slide Contents
*   **1. Ingestion**: Validates media files and claim text.
*   **2. Footprint**: Extracts EXIF tags and checks for C2PA content credentials.
*   **3. Harvesting**: Tavily retrieves live web coverage and news consensus.
*   **4. Stance Audit**: Classifies web matches into *Supports* or *Contradicts*.
*   **5. Signal Fusion**: Computes confidence and uncertainty.
*   **6. Reporting**: Synthesizes a grounded report with recommendations.

### 2. Suggested Visuals
*   Horizontal block arrow flowchart tracing: Ingestion ──► Ingress Diagnostics ──► Web Harvesting ──► Stance Check ──► Signal Fusion ──► Dashboard UI.

### 3. Speaker Notes
> "Here is how the pipeline runs. First, we digest the file and pull metadata. Second, we query live web search results. Third, we classify source stances. Finally, our scoring engine fuses these signals into a final verification dashboard."

---

## Slide 7 — System Architecture

### 1. Slide Contents
*   **Frontend**: React 19 SPA built with Tailwind CSS v4 and Leaflet maps.
*   **Backend**: FastAPI backend running on Uvicorn standard.
*   **AI Layer**: Google Gemini API (`gemini-2.5-flash`) for claim parsing, vision audits, and stance checks.
*   **Context Layer**: Tavily Search Engine queries web indices.
*   **Reliability Sandbox**: Includes timeouts and regex-based fallbacks to protect against server crashes.

### 2. Suggested Visuals
*   An architectural layout showing: React Client ◄──► FastAPI ◄──► Verification Pipeline (Claim, Media, Evidence, Fusion, Uncertainty, Explanation) ◄──► Tavily & Gemini APIs.

### 3. Speaker Notes
> "Our architecture is lightweight and stateless. We use React 19 on the front end, FastAPI on the backend, and Google Gemini as our reasoning engine. The pipeline includes timeout safeguards and sanitization protocols to keep the application stable during live presentations."

---

## Slide 8 — Competitor Comparison

### 1. Slide Contents
*   **Google SynthID**: Operates at the file level (watermarking AI-generated pixels). Does not verify claim context.
*   **C2PA Credentials**: Operates at the signature level (cryptographic author signatures). Vulnerable to re-contextualization if stripped.
*   **NYASA**: Operates at the system level (fusing file forensics, C2PA, EXIF, and web consensus). Verifies the claim.

### 2. Suggested Visuals
*   A clean feature comparison matrix:
    *   *Columns*: Feature, SynthID, C2PA, NYASA
    *   *Rows*: Metadata Ingestion, Cryptographic Signatures, Reverse Context Verification, Stance Consensus, Uncertainty Mapping.

### 3. Speaker Notes
> "Let's compare NYASA to industry standards. Google's SynthID detects AI-generated pixels. C2PA provides cryptographic lineage signatures. But neither checks what the claim is saying. NYASA is the only engine that fuses file forensics with real-world news consensus to verify the claim."

---

## Slide 9 — Impact & Future Scope

### 1. Slide Contents
*   **Target Users**: Newsrooms, fact-checkers, open-source intelligence (OSINT) teams, and social media platforms.
*   **Current MVP Scope**: Actively evaluates four pillars (**P1** Metadata, **P2** C2PA, **P3** Forensics, **P6** Web Context).
*   **Modality Boundaries**: Temporal (**P4**) and Cross-Modal (**P5**) consistency checks show `N/A` for static images, matching their format-dependent nature.
*   **Roadmap**: Future support for video and audio formats (lip-sync alignment, frame analysis).

### 2. Suggested Visuals
*   A road map diagram showing MVP (Image + Text Claims, 4 active pillars) leading to Release 1.0 (Video/Audio Temporal checks, P4 + P5 integration).

### 3. Speaker Notes
> "Currently, our MVP actively evaluates four pillars for image-and-claim verification, while temporal and cross-modal checks display 'N/A' as expected for static images. Our roadmap includes integrating frame analysis and lip-sync alignment to expand NYASA to video and audio formats. Thank you, and we welcome your questions."
