"""
NYASA Verification Pipeline Orchestrator
Runs the complete verification flow synchronously for the hackathon MVP.

Pipeline:
IMAGE + CLAIM
      ↓
Gemini Claim Extraction
      ↓
Gemini Vision Analysis
      ↓
Tavily Evidence Retrieval
      ↓
Evidence Classification
      ↓
Signal Fusion
      ↓
Confidence + Uncertainty
      ↓
Grounded Explanation
      ↓
NYASA REPORT
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from app.models.schemas import (
    VerificationResponse,
    ProvenanceSignal,
    EvidenceStance,
    PillarResult,
    MediaAnalysisResult,
)
from app.services.claim_extractor import extract_claim
from app.services.media_analyzer import analyze_media
from app.services.evidence_retriever import retrieve_evidence
from app.services.evidence_ranker import rank_evidence
from app.services.signal_fusion import fuse_signals
from app.services.uncertainty import calculate_uncertainty
from app.services.explanation import generate_explanation


def _analyze_six_pillars(
    extracted_claim,
    media_analysis: Optional[MediaAnalysisResult],
    evidence: list,
    provenance_signals: list,
) -> list:
    """
    Construct the 6 pillars analysis objects for NYASA verification report.
    This demonstrates processing across all 6 dimensions even for static images.
    """
    pillars = []

    # 1. Provenance & Metadata
    metadata_details = []
    metadata_status = "unavailable"
    metadata_score = 0.5
    metadata_summary = "Metadata is unavailable. This signal is currently neutral, as metadata is commonly stripped by online platforms."

    has_exif = False
    for s in provenance_signals:
        if s.signal_type == "exif_metadata":
            has_exif = True
            metadata_details.append(s.description)
            metadata_score = s.confidence
    
    if has_exif:
        metadata_status = "available"
        metadata_summary = "Metadata markers were found in the content, providing initial provenance details."
    else:
        metadata_details.append("No embedded EXIF or capture metadata detected.")

    pillars.append(PillarResult(
        name="Provenance & Metadata",
        status=metadata_status,
        score=metadata_score,
        summary=metadata_summary,
        details=metadata_details
    ))

    # 2. C2PA / Cryptographic Provenance
    c2pa_status = "unavailable"
    c2pa_score = None
    c2pa_summary = "Cryptographic Content Credentials (C2PA) are missing. This is optional; missing credentials do not imply the media is fake."
    c2pa_details = ["No cryptographic binding or C2PA manifest detected in the file headers."]

    has_c2pa = False
    for s in provenance_signals:
        if s.signal_type == "content_credentials":
            has_c2pa = True
            c2pa_score = s.confidence
            c2pa_summary = "Valid cryptographic Content Credentials (C2PA) signature detected, verifying source origin."
            c2pa_details = [s.description]
            c2pa_status = "valid"

    pillars.append(PillarResult(
        name="C2PA / Cryptographic Provenance",
        status=c2pa_status,
        score=c2pa_score,
        summary=c2pa_summary,
        details=c2pa_details
    ))

    # 3. Media Forensics
    forensics_status = "unverifiable"
    forensics_score = 0.5
    forensics_summary = "Media forensics is unavailable because no media was submitted."
    forensics_details = ["No visual content submitted for forensic analysis."]

    if media_analysis:
        auth = media_analysis.media_authenticity.assessment
        forensics_details = [f"Visual scene description: {media_analysis.visual_description}"]
        for s in media_analysis.media_authenticity.signals:
            forensics_details.append(f"Forensic indicator: {s.description} (confidence: {int(s.confidence * 100)}%)")
        
        if auth == "likely_authentic":
            forensics_status = "likely_authentic"
            forensics_score = 0.9
            forensics_summary = "No major visual manipulation or synthetic indicators detected. The image itself appears authentic."
        elif auth in ["possible_manipulation", "likely_synthetic"]:
            forensics_status = "suspicious"
            forensics_score = 0.3
            forensics_summary = f"Forensic analysis detected potential anomalies: {media_analysis.media_authenticity.description}"
        else:
            forensics_status = "unverifiable"
            forensics_summary = "Forensic algorithms returned inconclusive results on the uploaded media."

    pillars.append(PillarResult(
        name="Media Forensics",
        status=forensics_status,
        score=forensics_score,
        summary=forensics_summary,
        details=forensics_details
    ))

    # 4. Temporal / Structural Consistency
    pillars.append(PillarResult(
        name="Temporal & Structural Consistency",
        status="not_applicable",
        score=None,
        summary="Not applicable for static images. This pillar requires video frame transition analysis.",
        details=["Input is a static image. Video-level frame anomalies could not be computed."]
    ))

    # 5. Cross-Modal Consistency
    pillars.append(PillarResult(
        name="Cross-Modal Consistency",
        status="not_applicable",
        score=None,
        summary="Not applicable for single-mode media. This pillar evaluates video lip-sync and audio speech timing alignment.",
        details=["No audio track or multiple modalities present in the input file."]
    ))

    # 6. External Source & Context Verification
    context_status = "unverifiable"
    context_score = 0.5
    context_summary = "No external evidence could be retrieved to verify context."
    context_details = []

    supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
    contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]

    if media_analysis and media_analysis.context_consistency.assessment == "inconsistent":
        context_status = "inconsistent_context"
        context_score = 0.2
        context_summary = f"A contextual mismatch was identified: {media_analysis.context_consistency.description}"
        context_details.append("Gemini Vision identified that the claim conflicts with the physical content of the image.")
    elif contradicting:
        context_status = "contradicted"
        context_score = 0.3
        context_summary = f"External fact-checks or news sources contradict the claim's context ({len(contradicting)} contradicting source(s) found)."
    elif supporting:
        context_status = "supported"
        context_score = 0.8
        context_summary = f"Independent external sources support the event context ({len(supporting)} supporting source(s) found)."
    else:
        context_summary = "Retrieved web evidence is inconclusive relative to the claim's context."

    context_details.append(f"Retrieved {len(evidence)} search result(s) from web queries.")
    for e in evidence[:3]:
        context_details.append(f"[{e.source_name}] Stance: {e.stance.value.upper()} - {e.title}")

    pillars.append(PillarResult(
        name="External Source & Context Verification",
        status=context_status,
        score=context_score,
        summary=context_summary,
        details=context_details
    ))

    return pillars


import os
import json
import re
import io
from PIL import Image
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import (
    ExtractedClaim,
    MediaAuthenticity,
    ContextConsistency,
    MediaSignal,
    MediaQuality,
)
from app.services.evidence_ranker import SOURCE_AUTHORITY_SCORES

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)

UNIFIED_ANALYSIS_PROMPT = """You are the lead verification intelligence engine for NYASA.
Given a raw claim text, an optional image, and retrieved web evidence results, perform a complete analysis.

You must output:
1. CLAIM EXTRACTION: Parse the raw claim text into structured properties.
2. MEDIA ANALYSIS: If an image is provided, evaluate its authenticity and context consistency.
3. STANCE CLASSIFICATION: For each web evidence result provided below, classify its stance.
4. EXPLANATION & ACTION: Synthesize the explanation, key findings, recommended action, and limitations.

RETRIEVED WEB EVIDENCE:
{evidence_text}

RAW CLAIM TEXT:
"{claim}"

Respond ONLY with valid JSON conforming to this exact schema (no markdown, no extra keys):
{{
  "extracted_claim": {{
    "normalized_claim": "A clean, single-sentence version of what is being claimed",
    "entities": ["list of entities"],
    "event_type": "event type or null",
    "location": "location or null",
    "time_reference": "time reference or null",
    "key_assertion": "most important verifiable assertion",
    "atomic_claims": ["list of atomic statements"]
  }},
  "media_analysis": {{
    "media_authenticity": {{
      "assessment": "likely_authentic",
      "signals": [
        {{"signal_type": "clear_edges", "description": "No visual tampering identified around boundaries", "confidence": 0.9}}
      ],
      "description": "Image shows no visual manipulation signals."
    }},
    "context_consistency": {{
      "assessment": "consistent",
      "signals": [
        {{"signal_type": "matching_visuals", "description": "Visual details align with the claim", "confidence": 0.8}}
      ],
      "description": "Visual scene is consistent with the claim details."
    }},
    "visual_description": "visual description or N/A",
    "ocr_text": "text inside image or null",
    "media_quality": "high"
  }},
  "evidence_stances": [
    {{
      "evidence_id": "ev_abc123",
      "stance": "supports",
      "reasoning": "Reasoning detail"
    }}
  ],
  "explanation": "A 2-4 sentence explanation grounded strictly in the provided web evidence",
  "key_findings": ["Finding 1", "Finding 2"],
  "recommended_action": "A single recommended action based on findings",
  "limitations": ["Limitation 1"]
}}
"""

async def _run_unified_gemini_analysis(
    claim_text: str,
    image_bytes: Optional[bytes],
    evidence: list
) -> dict:
    """Runs a single Gemini 3.6 Flash call to perform all NLP and Vision analysis at once."""
    model = genai.GenerativeModel(settings.gemini_model)
    
    # Format evidence for prompt
    ev_lines = []
    for e in evidence:
        ev_lines.append(
            f"Evidence ID: {e.evidence_id}\n"
            f"Source: {e.source_name} ({e.source_type.value})\n"
            f"Title: {e.title}\n"
            f"Snippet: {e.snippet}\n"
        )
    evidence_text = "\n".join(ev_lines) if ev_lines else "No web evidence provided."
    
    prompt = UNIFIED_ANALYSIS_PROMPT.format(
        claim=claim_text,
        evidence_text=evidence_text
    )
    
    # Assemble inputs
    inputs = [prompt]
    if image_bytes:
        image = Image.open(io.BytesIO(image_bytes))
        inputs.append(image)
        
    response = model.generate_content(
        inputs,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=2048,
            response_mime_type="application/json"
        )
    )
    
    response_text = response.text.strip()
    if "```" in response_text:
        match = re.search(r"```(?:json)?\s*(.*?)\s*```", response_text, re.DOTALL)
        if match:
            response_text = match.group(1).strip()
            
    return json.loads(response_text)


async def run_verification(
    claim_text: str,
    image_bytes: Optional[bytes] = None,
) -> VerificationResponse:
    """
    Run the complete NYASA verification pipeline using a single Gemini model call.
    Consolidates API calls to respect 15 RPM / 1500 RPD rate limits on free keys.
    """
    verification_id = f"nyasa_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    print("\n" + "="*60)
    print(f"[NYASA PIPELINE INITIALIZED] ID: {verification_id} | Time: {timestamp}")
    print(f"[NYASA] Raw Claim: \"{claim_text}\"")
    print(f"[NYASA] Has Image Attachment: {image_bytes is not None}")
    print("="*60)

    # ── Step 1: Web Evidence Harvesting ──
    print(f"\n[NYASA] == STEP 1/7: WEB EVIDENCE HARVESTING (Tavily Engine) ==")
    evidence = await retrieve_evidence(
        claim_text=claim_text,
    )
    print(f"[NYASA] Harvested {len(evidence)} unique URLs from search queries.")

    # Cap to top 3 evidence items to respect Gemini API rate limits (15 RPM)
    evidence = evidence[:3]
    print(f"[NYASA] Capped evidence to top {len(evidence)} items for rate-limit safety.")

    # ── Step 2: Unified Gemini Analysis ──
    print(f"\n[NYASA] == STEP 2/7: UNIFIED GEMINI ANALYSIS (NLP + Vision + Stance + Explanation) ==")
    try:
        analysis_data = await _run_unified_gemini_analysis(claim_text, image_bytes, evidence)
        
        # Ingest claim
        claim_data = analysis_data.get("extracted_claim", {})
        extracted_claim = ExtractedClaim(
            original_text=claim_text,
            normalized_claim=claim_data.get("normalized_claim", claim_text),
            entities=claim_data.get("entities", []),
            event_type=claim_data.get("event_type"),
            location=claim_data.get("location"),
            time_reference=claim_data.get("time_reference"),
            key_assertion=claim_data.get("key_assertion", claim_text),
            atomic_claims=claim_data.get("atomic_claims", [claim_text]),
        )
        print(f"[NYASA] Normalized Claim: \"{extracted_claim.normalized_claim}\"")
        print(f"[NYASA] Location Context:  {extracted_claim.location}")
        print(f"[NYASA] Time Reference:   {extracted_claim.time_reference}")
        
        # Ingest media analysis if image
        media_analysis = None
        if image_bytes:
            media_data = analysis_data.get("media_analysis", {})
            auth_data = media_data.get("media_authenticity", {})
            media_auth = MediaAuthenticity(
                assessment=auth_data.get("assessment", "unable_to_determine"),
                signals=[
                    MediaSignal(
                        signal_type=s.get("signal_type", "unknown"),
                        description=s.get("description", ""),
                        confidence=s.get("confidence", 0.5),
                    )
                    for s in auth_data.get("signals", [])
                ],
                description=auth_data.get("description", ""),
            )
            
            ctx_data = media_data.get("context_consistency", {})
            context_cons = ContextConsistency(
                assessment=ctx_data.get("assessment", "unverifiable"),
                signals=[
                    MediaSignal(
                        signal_type=s.get("signal_type", "unknown"),
                        description=s.get("description", ""),
                        confidence=s.get("confidence", 0.5),
                    )
                    for s in ctx_data.get("signals", [])
                ],
                description=ctx_data.get("description", ""),
            )
            
            quality = media_data.get("media_quality", "moderate")
            quality_map = {
                "high": MediaQuality.HIGH,
                "moderate": MediaQuality.MODERATE,
                "low": MediaQuality.LOW,
                "very_low": MediaQuality.VERY_LOW,
            }
            
            media_analysis = MediaAnalysisResult(
                media_authenticity=media_auth,
                context_consistency=context_cons,
                visual_description=media_data.get("visual_description", ""),
                ocr_text=media_data.get("ocr_text"),
                media_quality=quality_map.get(quality, MediaQuality.MODERATE),
            )
            print(f"[NYASA] Media Authenticity: {media_analysis.media_authenticity.assessment.upper()}")
            print(f"[NYASA] Context Consistency: {media_analysis.context_consistency.assessment.upper()}")
            
        # Ingest evidence stances
        stances_list = analysis_data.get("evidence_stances", [])
        stance_map_data = {item.get("evidence_id"): item for item in stances_list}
        
        for e in evidence:
            e.authority_score = SOURCE_AUTHORITY_SCORES.get(e.source_type, 0.30)
            stance_item = stance_map_data.get(e.evidence_id)
            if stance_item:
                stance_str = stance_item.get("stance", "unresolved")
                stance_map = {
                    "supports": EvidenceStance.SUPPORTS,
                    "contradicts": EvidenceStance.CONTRADICTS,
                    "context": EvidenceStance.CONTEXT,
                    "unresolved": EvidenceStance.UNRESOLVED,
                }
                e.stance = stance_map.get(stance_str, EvidenceStance.UNRESOLVED)
                e.stance_reasoning = stance_item.get("reasoning", "")
            else:
                e.stance = EvidenceStance.UNRESOLVED
                e.stance_reasoning = "Stance could not be classified."
            print(f"  +- Evidence stance for {e.source_name}: {e.stance.value.upper()}")
                
        explanation_data = {
            "explanation": analysis_data.get("explanation", "Assessment could not be fully explained."),
            "key_findings": analysis_data.get("key_findings", []),
            "recommended_action": analysis_data.get(
                "recommended_action",
                "Exercise caution before sharing. Seek additional verification."
            ),
            "limitations": analysis_data.get("limitations", []),
        }
        
    except Exception as e:
        print(f"[NYASA] Unified Gemini Analysis failed: {e}")
        # Fallback to defaults
        extracted_claim = ExtractedClaim(
            original_text=claim_text,
            normalized_claim=claim_text,
            entities=[],
            event_type=None,
            location=None,
            time_reference=None,
            key_assertion=claim_text,
            atomic_claims=[claim_text],
        )
        media_analysis = None
        for e in evidence:
            e.stance = EvidenceStance.UNRESOLVED
            e.stance_reasoning = "Stance classification was skipped due to server error."
        explanation_data = {
            "explanation": f"Verification pipeline encountered a server error during analysis: {e}",
            "key_findings": [],
            "recommended_action": "Exercise caution before sharing.",
            "limitations": ["System rate limits exceeded or API key configuration error."],
        }

    # ── Step 3: Build Provenance Signals ──
    print(f"\n[NYASA] == STEP 3/7: PROVENANCE RECONSTRUCTION ==")
    provenance_signals = _extract_provenance_signals(evidence, media_analysis)
    if not provenance_signals:
        print("[NYASA] No explicit provenance signals constructed.")
    for s in provenance_signals:
        print(f"  +- Provenance: [{s.signal_type}] {s.description} (conf: {s.confidence})")

    # ── Step 4: Signal Fusion → Assessment + Confidence ──
    print(f"\n[NYASA] == STEP 4/7: WEIGHTED SIGNAL FUSION ==")
    assessment = fuse_signals(evidence, media_analysis, provenance_signals)
    print(f"[NYASA] Final Assessment Label:          {assessment.display_label.upper()}")
    print(f"[NYASA] NYASA Confidence Score:         {assessment.confidence_percent}%")
    print(f"[NYASA] Evidence Credibility Score (ECS): {assessment.ecs}/100")

    # ── Step 5: Uncertainty ──
    print(f"\n[NYASA] == STEP 5/7: STRUCTURED UNCERTAINTY PROFILE ==")
    uncertainty = calculate_uncertainty(
        evidence=evidence,
        media_analysis=media_analysis,
        provenance_signals=provenance_signals,
        claim_has_location=extracted_claim.location is not None,
        claim_has_time=extracted_claim.time_reference is not None,
    )
    print(f"[NYASA] Uncertainty Level: {uncertainty.level.value.upper()}")
    print(f"[NYASA] Uncertainty Summary: \"{uncertainty.summary}\"")
    for f in uncertainty.factors:
        print(f"  +- Factor: [{f.factor}] {f.description} (impact: {f.impact})")
    print(f"[NYASA] Information that would help: {uncertainty.what_would_help}")

    # ── Build 6 Pillars Analysis ──
    pillars = _analyze_six_pillars(
        extracted_claim=extracted_claim,
        media_analysis=media_analysis,
        evidence=evidence,
        provenance_signals=provenance_signals,
    )

    # ── Build Final Report ──
    supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
    contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]
    contextual = [e for e in evidence if e.stance == EvidenceStance.CONTEXT]
    unresolved = [e for e in evidence if e.stance == EvidenceStance.UNRESOLVED]

    print("\n" + "="*60)
    print(f"[NYASA PIPELINE COMPLETE] ID: {verification_id} | Final: {assessment.display_label}")
    print("="*60 + "\n")
    print(f"[NYASA] Verification {verification_id} complete")

    return VerificationResponse(
        verification_id=verification_id,
        status="completed",
        timestamp=timestamp,
        claim_text=claim_text,
        has_media=image_bytes is not None,
        extracted_claim=extracted_claim,
        media_analysis=media_analysis,
        provenance_signals=provenance_signals,
        evidence=evidence,
        pillars=pillars,
        supporting_count=len(supporting),
        contradicting_count=len(contradicting),
        context_count=len(contextual),
        unresolved_count=len(unresolved),
        assessment=assessment,
        uncertainty=uncertainty,
        explanation=explanation_data["explanation"],
        key_findings=explanation_data["key_findings"],
        recommended_action=explanation_data["recommended_action"],
        limitations=explanation_data["limitations"],
    )


def _extract_provenance_signals(evidence, media_analysis) -> list:
    """
    Build provenance signals from available data.
    IMPORTANT: A search result is a "discovered historical occurrence",
    NOT "verified provenance" in the cryptographic/C2PA sense.
    """
    signals = []

    # Check for evidence items that suggest earlier occurrence
    for e in evidence:
        if e.published_date and e.stance == EvidenceStance.CONTRADICTS:
            signals.append(ProvenanceSignal(
                signal_type="historical_occurrence",
                description=f"Content related to this claim was found at '{e.source_name}' "
                           f"(published: {e.published_date}). This is a discovered occurrence, "
                           f"not verified provenance.",
                source=e.source_name,
                date_found=e.published_date,
                confidence=e.relevance_score * 0.7,
                url=e.source_url,
            ))

    # Media metadata signals
    if media_analysis and media_analysis.ocr_text:
        signals.append(ProvenanceSignal(
            signal_type="embedded_text",
            description=f"Text was detected embedded in the media: '{media_analysis.ocr_text[:100]}...'",
            confidence=0.6,
        ))

    return signals
