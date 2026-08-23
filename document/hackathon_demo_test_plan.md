# NYASA — Hackathon Demo Test Plan

This document outlines exactly three demo test cases designed to showcase the active, verified features of the NYASA verification engine to hackathon judges.

---

## TEST CASE 1: Authentic Media with Misleading Context

### 1. Parameters
*   **Test Case Name**: Misleading Geographic Context ( Lahore Floods labeled as Mysuru)
*   **Input Media**: A clean, unedited photo of urban street flooding (e.g. `media_1787391535689.img`).
*   **Claim Text**: `"Heavy floods in Mysuru city today, causing traffic blockages."`

### 2. Expected System Behavior
*   **Pipeline Ingestion**: EXIF metadata is parsed (stripped by social media = `UNAVAILABLE`), C2PA signatures are scanned (absent = `UNAVAILABLE`).
*   **Context Verification (P6)**: Tavily searches verify the claim. The engine retrieves reports confirming the image was actually captured in Lahore, Pakistan in a previous year.
*   **Score Fusion**: The system identifies that the media itself is authentic (no digital edits/AI generation), but the *context* is inconsistent.
*   **Expected Pillars**:
    *   P1: `UNAVAILABLE` (EXIF missing)
    *   P2: `UNAVAILABLE` (C2PA missing)
    *   P3: `AUTHENTIC` (No digital doctoring detected)
    *   P4 & P5: `N/A` (Static image)
    *   P6: `CONTRADICTED` or `MISLEADING_CONTEXT`
*   **Assessment**: **Likely Misleading** (or *Claim Contradicted by Evidence*)
*   **Confidence Range**: `75% - 85%`
*   **ECS Behavior**: `40 - 55` (Multiple contradicting search sources with high authority scores)
*   **Uncertainty**: **Moderate** (due to missing cryptographic headers and camera EXIF metadata)

### 3. Key USP & Judge Talking Point
*   **USP**: Demonstrates why watermarks and cryptographic metadata alone are insufficient. A photo can be 100% authentic but used to spread lies by altering the location and time.
*   **Judge Talking Point**: *"Look at this image. If we only checked C2PA content credentials or SynthID watermarks, this would pass as authentic. But NYASA's contextual consensus engine (Pillar 6) cross-references it with live news coverage and the map to show that this is actually an old photo from Lahore, Pakistan, proving the claim is misleading."*

---

## TEST CASE 2: Genuine Content where the Claim is Supported

### 1. Parameters
*   **Test Case Name**: Real-Time News Consensus
*   **Input Media**: None (Text-only claim).
*   **Claim Text**: `"US imposes 50 per cent tariffs on $20 billion of Canadian goods after trade talks fail"`

### 2. Expected System Behavior
*   **Pipeline Ingestion**: Detects text-only input. Sets media-related pillars (P1, P2, P3, P4, P5) to `UNAVAILABLE` or `N/A`.
*   **Web Harvesting**: Tavily queries news feeds. Returns search results from major publications supporting the tariff negotiations.
*   **Stance Classification**: Local/Gemini classifier matches terms and marks the source stance as `SUPPORTS`.
*   **Expected Pillars**:
    *   P1, P2, P3: `UNAVAILABLE` (No media provided)
    *   P4, P5: `N/A` (Not applicable)
    *   P6: `SUPPORTED`
*   **Assessment**: **Likely Supported** (or *Strongly Supported*)
*   **Confidence Range**: `80% - 95%`
*   **ECS Behavior**: `40 - 50` (Strong domain diversity and signal agreement)
*   **Uncertainty**: **Moderate** (due to missing media verification layers, offset by high evidence agreement)

### 3. Key USP & Judge Talking Point
*   **USP**: Showcases the real-time stance classification and query generation engine, producing a trust index even without attached media.
*   **Judge Talking Point**: *"NYASA is a multimodal verification engine. Here, we submit a text-only claim. The system retrieves live web sources and matches their stance using NLP. It shows a 90% confidence score and lists the supporting articles so the user can verify the news consensus."*

---

## TEST CASE 3: Inconclusive Query showing Uncertainty

### 1. Parameters
*   **Test Case Name**: Unverified Local Rumor
*   **Input Media**: Blurry photo of a generic backyard at night.
*   **Claim Text**: `"Alien spacecraft landed in the backyard of a house in local village yesterday"`

### 2. Expected System Behavior
*   **Pipeline Ingestion**: EXIF/C2PA are missing.
*   **Web Harvesting**: Tavily returns 0 search results matching this claim.
*   **Stance Classification**: Bypassed (empty evidence list).
*   **Scoring**: No active verification signals are present. The confidence score is set to exactly `0%`.
*   **Expected Pillars**:
    *   P1, P2: `UNAVAILABLE`
    *   P3: `UNVERIFIABLE` (low quality, inconclusive)
    *   P4, P5: `N/A`
    *   P6: `UNVERIFIABLE`
*   **Assessment**: **Insufficient Evidence** (or *Inconclusive*)
*   **Confidence Range**: Exactly `0%`
*   **ECS Behavior**: `0/100`
*   **Uncertainty**: **High** (Uncertainty score `>40` due to absent search coverage, missing metadata, and low quality)

### 3. Key USP & Judge Talking Point
*   **USP**: Demonstrates that NYASA is honest. When there is no evidence, it never guesses or returns false declarations; instead, it reports high uncertainty and lists exactly what information is missing.
*   **Judge Talking Point**: *"When an event has no online coverage and the image lacks metadata, NYASA doesn't make things up. It reports 0% confidence and flags the claim with High Uncertainty. It also lists exactly what would help verify the claim, such as original camera metadata or a cryptographic signature."*

---

## 4. Live search dependencies & Backup strategy

*   **Live search dependency**: Test Case 1 and 2 query Tavily to fetch matching articles.
*   **Backup Staging Scenario**: If Tavily is offline or live searches fail to fetch relevant results, Test Case 1 is backed up by pre-compiled coordinate mock arrays inside `PillarsPanel.tsx` (which automatically trigger the Mysuru-Lahore coordinates map when Mysuru is typed in the claim).
