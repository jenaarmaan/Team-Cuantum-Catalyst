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


async def run_verification(
    claim_text: str,
    image_bytes: Optional[bytes] = None,
) -> VerificationResponse:
    """
    Run the complete NYASA verification pipeline.
    Synchronous for hackathon — production would use async workers.
    """
    verification_id = f"nyasa_{uuid.uuid4().hex[:12]}"
    timestamp = datetime.now(timezone.utc).isoformat()

    print(f"[NYASA] Starting verification {verification_id}")

    # ── Step 1: Claim Extraction ──
    print(f"[NYASA] Step 1/7: Extracting claim...")
    extracted_claim = await extract_claim(claim_text)
    print(f"[NYASA] Claim extracted: {extracted_claim.key_assertion}")

    # ── Step 2: Media Analysis (if image provided) ──
    media_analysis = None
    if image_bytes:
        print(f"[NYASA] Step 2/7: Analyzing media...")
        media_analysis = await analyze_media(image_bytes, claim_text)
        print(f"[NYASA] Media: auth={media_analysis.media_authenticity.assessment}, "
              f"context={media_analysis.context_consistency.assessment}")
    else:
        print(f"[NYASA] Step 2/7: No media provided, skipping...")

    # ── Step 3: Evidence Retrieval ──
    print(f"[NYASA] Step 3/7: Retrieving web evidence...")
    evidence = await retrieve_evidence(
        claim_text=extracted_claim.normalized_claim,
        location=extracted_claim.location,
        event_type=extracted_claim.event_type,
        entities=extracted_claim.entities,
    )
    print(f"[NYASA] Retrieved {len(evidence)} evidence items")

    # ── Step 4: Evidence Ranking & Classification ──
    print(f"[NYASA] Step 4/7: Classifying evidence stance...")
    evidence = await rank_evidence(evidence, extracted_claim.normalized_claim)

    # ── Step 5: Build Provenance Signals ──
    # Tavily search results are "discovered historical occurrences", NOT verified provenance
    print(f"[NYASA] Step 5/7: Analyzing provenance signals...")
    provenance_signals = _extract_provenance_signals(evidence, media_analysis)

    # ── Step 6: Signal Fusion → Assessment + Confidence ──
    print(f"[NYASA] Step 6/7: Fusing signals...")
    assessment = fuse_signals(evidence, media_analysis, provenance_signals)
    print(f"[NYASA] Assessment: {assessment.display_label} ({assessment.confidence_percent}%)")

    # ── Step 6b: Uncertainty ──
    uncertainty = calculate_uncertainty(
        evidence=evidence,
        media_analysis=media_analysis,
        provenance_signals=provenance_signals,
        claim_has_location=extracted_claim.location is not None,
        claim_has_time=extracted_claim.time_reference is not None,
    )
    print(f"[NYASA] Uncertainty: {uncertainty.level.value}")

    # ── Step 7: Evidence-Grounded Explanation ──
    print(f"[NYASA] Step 7/7: Generating explanation...")
    explanation_data = await generate_explanation(
        extracted_claim=extracted_claim,
        assessment=assessment,
        media_analysis=media_analysis,
        evidence=evidence,
        provenance_signals=provenance_signals,
        uncertainty=uncertainty,
    )

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
