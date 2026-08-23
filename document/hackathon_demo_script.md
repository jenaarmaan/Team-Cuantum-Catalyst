# NYASA — TIMED LIVE PITCH & DEMO SCRIPT (3 Minutes Total)

This document provides the timed speaker scripts, click triggers, pointing coordinates, and backup phrases for the live hackathon presentation.

---

## TIMING OVERVIEW

*   **Member 1 (0:00 - 0:45)**: Introduction, Decoy case study, Problem, Solution.
*   **Member 2 (0:45 - 1:25)**: USPs, 6 Pillars, Scopes (Confidence vs. ECS vs. Uncertainty).
*   **Member 3 (1:25 - 2:20)**: Live Demo, Click cues, Walkthrough.
*   **Member 4 (2:20 - 3:00)**: Tech stack, Local NLP fallback, Impact, 20s Closing.

---

## MEMBER 1: Pitch Intro & Case Study (45 Seconds)

### Spoken Script
> "Good afternoon, judges. I’m [Name], and this is NYASA. In the battle against fake news, standard detectors focus exclusively on the file—checking metadata or scanning pixels for AI generation. 
> But here is the decoy: what if the media is 100% authentic, but the story attached to it is completely false? 
> For example, an unedited photo of street floods taken in Lahore years ago is posted on social media claiming to show 'floods in Mysuru today.' 
> Hash checkers and watermarks check the file and declare it 'authentic.' The system is blind to context. NYASA solves this. We verify the *evidence* behind the claim, not just the pixels."

*   **Suggested Gesture**: Point to the slide showing the flood photo next to a tweet.
*   **Transition (0:45)**: *"Now, [Member 2] will explain how NYASA evaluates this credibility."*

---

## MEMBER 2: Pillars & Multi-Signal Scoring (40 Seconds)

### Spoken Script
> "Thanks, [Member 1]. NYASA breaks down verification into six independent pillars. 
> Pillars 1, 2, and 3 check the file: metadata footprint, C2PA content credentials, and visual forensics. 
> Pillars 4 and 5 are video-dependent temporal checks. 
> But Pillar 6 is the game-changer: External Context Verification. We query live web consensus to determine if the facts match. 
> Instead of a binary 'True/False' check, we report three distinct metrics: a weighted Confidence Score, an Evidence Credibility Score mapping source quality, and an Uncertainty Level showing what remains unknown."

*   **Suggested Gesture**: Open the app screen and hover hand near the visual nodes.
*   **Transition (1:25)**: *"Let's see this live. Over to [Member 3]."*

---

## MEMBER 3: Live Demo & Walkthrough (55 Seconds)

### Spoken Script
> "Thanks. I've entered a claim about Mysuru floods and uploaded our test image. 
> **[CLICK: Analyze button]** 
> As the engine runs, you see the pipeline steps animate in real-time. 
> **[POINT: Verdict badge]** 
> The result is in: NYASA labels this 'Likely Misleading' with 85% Confidence. 
> **[POINT: Pillars Panel P6 row]** 
> When we expand Pillar 6, you see our Leaflet Context Map. It shows a clear location conflict: the claim says Mysuru, but our retrieved web evidence traces this photo to Lahore, Pakistan. 
> **[POINT: Uncertainty Panel]** 
> Note that our Uncertainty is Moderate. The system explicitly tells the user that while search coverage is high, EXIF metadata and C2PA credentials are stripped, warning us of missing source info."

### Demo Interaction Cues
1.  **At 1:26**: Hover over the claim text and image inside `<UploadBox />`.
2.  **At 1:28**: Click the **Analyze with NYASA** button.
3.  **At 1:35**: Point to the **Verdict Display Badge** (showing `Likely Misleading`).
4.  **At 1:45**: Click to expand the **P6 External Source Verification** row.
5.  **At 1:50**: Point to the red vector line connecting Mysuru to Lahore on the Leaflet map.
6.  **At 2:05**: Point to the **Uncertainty Factors list** below the map.

### Live Troubleshooting Fallbacks
*   **Backup 1 (If Tavily search is slow)**:  
    > *"Our web evidence harvesting is querying live search engines in real-time, matching coverage across active news portals to ensure zero stale database lookups."*
*   **Backup 2 (If Gemini is rate-limited and local fallback activates)**:  
    > *"The Gemini free-tier quota is currently busy, so our local NLP fallback engine has automatically taken over to parse search stances in real-time, keeping the demo running."*

*   **Transition (2:20)**: *"Now, [Member 4] will discuss our architecture."*

---

## MEMBER 4: Tech Stack, Fallback, & Closing (40 Seconds)

### Spoken Script
> "Thanks. NYASA is built on a React 19 front end and a FastAPI backend. We query Google Gemini 2.5 Flash for vision forensics and claim parsing, and Tavily for live web searches. 
> To ensure reliability, we built an isolated sandbox. If API connections time out or exceed quotas, our local token classifier runs offline NLP stance checks on search titles, keeping the application online. 
> Misinformation is an evidence-fusion problem. By combining file forensics with real-time web consensus, NYASA provides a clear roadmap for journalists, fact-checkers, and platform moderators."

### Final 20-Second Closing (Starts at 2:40)
> "By separating file authenticity from claim context, and displaying uncertainty instead of binary assumptions, NYASA helps you evaluate not just what a file *looks* like, but what the story behind it *means*. Can you know what's real? With NYASA, you can see the proof. Thank you, and we welcome your questions."
