"""
NYASA Signal Fusion Engine
Combines all verification signals into a non-binary assessment with NYASA Confidence Score.

IMPORTANT: The confidence score is derived from weighted verification signals.
It is a prototype heuristic, NOT a scientifically calibrated probability.
The weights are engineering design choices and should be disclosed as such.
"""

from typing import List, Optional
from app.models.schemas import (
    AssessmentResult,
    AssessmentLabel,
    EvidenceItem,
    EvidenceStance,
    MediaAnalysisResult,
    ProvenanceSignal,
)


# Prototype weights — explicitly disclosed as engineering assumptions
WEIGHTS = {
    "evidence_strength": 0.30,
    "source_consistency": 0.25,
    "provenance_strength": 0.20,
    "media_analysis": 0.15,
    "cross_source_agreement": 0.10,
}


def _compute_evidence_strength(evidence: List[EvidenceItem]) -> float:
    """Score based on volume and quality of evidence."""
    if not evidence:
        return 0.3  # No evidence = low signal, not automatic failure

    supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
    contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]

    # Weighted by authority
    support_score = sum(e.relevance_score * e.authority_score for e in supporting)
    contradict_score = sum(e.relevance_score * e.authority_score for e in contradicting)

    total = support_score + contradict_score
    if total == 0:
        return 0.5  # No meaningful stance = neutral

    # How much the dominant stance dominates
    dominance = max(support_score, contradict_score) / total
    return min(dominance, 1.0)


def _compute_source_consistency(evidence: List[EvidenceItem]) -> float:
    """How much do sources agree with each other?"""
    if len(evidence) < 2:
        return 0.4

    stances = [e.stance for e in evidence]
    supporting = stances.count(EvidenceStance.SUPPORTS)
    contradicting = stances.count(EvidenceStance.CONTRADICTS)
    total_meaningful = supporting + contradicting

    if total_meaningful == 0:
        return 0.5

    # Perfect agreement = 1.0, perfect split = 0.0
    consistency = abs(supporting - contradicting) / total_meaningful
    return consistency


def _compute_provenance_strength(provenance_signals: List[ProvenanceSignal]) -> float:
    """Score based on available provenance information."""
    if not provenance_signals:
        return 0.3  # No provenance != disproven

    avg_confidence = sum(s.confidence for s in provenance_signals) / len(provenance_signals)
    # More signals = slightly higher provenance strength
    volume_bonus = min(len(provenance_signals) * 0.05, 0.15)
    return min(avg_confidence + volume_bonus, 1.0)


def _compute_media_score(media_analysis: Optional[MediaAnalysisResult]) -> float:
    """Score from media analysis signals."""
    if media_analysis is None:
        return 0.5  # No media = neutral

    auth = media_analysis.media_authenticity.assessment
    ctx = media_analysis.context_consistency.assessment

    # Media authenticity scoring
    auth_scores = {
        "likely_authentic": 0.8,
        "possible_manipulation": 0.4,
        "likely_synthetic": 0.2,
        "unable_to_determine": 0.5,
    }

    # Context consistency scoring
    ctx_scores = {
        "consistent": 0.9,
        "partially_consistent": 0.6,
        "inconsistent": 0.2,
        "unverifiable": 0.5,
    }

    auth_score = auth_scores.get(auth, 0.5)
    ctx_score = ctx_scores.get(ctx, 0.5)

    # Context consistency matters more for the overall claim assessment
    return auth_score * 0.4 + ctx_score * 0.6


def _compute_cross_source_agreement(evidence: List[EvidenceItem]) -> float:
    """How many independent source types agree?"""
    if not evidence:
        return 0.5

    # Group by source type
    stance_by_type = {}
    for e in evidence:
        if e.source_type not in stance_by_type:
            stance_by_type[e.source_type] = []
        stance_by_type[e.source_type].append(e.stance)

    if len(stance_by_type) < 2:
        return 0.4  # Only one type of source

    # Check if different source types agree on the dominant stance
    type_stances = []
    for src_type, stances in stance_by_type.items():
        supporting = stances.count(EvidenceStance.SUPPORTS)
        contradicting = stances.count(EvidenceStance.CONTRADICTS)
        if supporting > contradicting:
            type_stances.append("supports")
        elif contradicting > supporting:
            type_stances.append("contradicts")
        else:
            type_stances.append("neutral")

    # Agreement ratio
    if not type_stances:
        return 0.5
    most_common = max(set(type_stances), key=type_stances.count)
    agreement = type_stances.count(most_common) / len(type_stances)
    return agreement


def _determine_assessment_label(
    evidence: List[EvidenceItem],
    media_analysis: Optional[MediaAnalysisResult],
    confidence: float,
) -> tuple[AssessmentLabel, str]:
    """Determine the non-binary assessment label and human-readable display."""

    supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
    contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]

    has_media = media_analysis is not None
    media_manipulated = has_media and media_analysis.media_authenticity.assessment in [
        "possible_manipulation", "likely_synthetic"
    ]
    context_inconsistent = has_media and media_analysis.context_consistency.assessment == "inconsistent"

    # No evidence at all
    if not evidence:
        return AssessmentLabel.INSUFFICIENT_EVIDENCE, "Insufficient Evidence"

    # Strong manipulation signals
    if media_manipulated and confidence > 0.6:
        return AssessmentLabel.MANIPULATION_SIGNALS_DETECTED, "Manipulation Signals Detected"

    # Context inconsistency is the key differentiator
    if context_inconsistent and len(contradicting) > len(supporting):
        if confidence > 0.7:
            return AssessmentLabel.LIKELY_MISLEADING, "Likely Misleading"
        else:
            return AssessmentLabel.INCONCLUSIVE, "Inconclusive"

    # Strong contradiction
    if len(contradicting) >= 3 and len(supporting) == 0 and confidence > 0.7:
        return AssessmentLabel.STRONGLY_CONTRADICTED, "Strongly Contradicted"

    # Likely misleading
    if len(contradicting) > len(supporting) and confidence > 0.5:
        return AssessmentLabel.LIKELY_MISLEADING, "Likely Misleading"

    # Likely supported
    if len(supporting) > len(contradicting) and confidence > 0.6:
        if len(supporting) >= 3 and len(contradicting) == 0:
            return AssessmentLabel.STRONGLY_SUPPORTED, "Strongly Supported"
        return AssessmentLabel.LIKELY_SUPPORTED, "Likely Supported"

    # Default: inconclusive
    return AssessmentLabel.INCONCLUSIVE, "Inconclusive"


def compute_ecs(
    evidence: List[EvidenceItem],
    media_analysis: Optional[MediaAnalysisResult],
    provenance_signals: List[ProvenanceSignal],
) -> int:
    """
    Calculate the Evidence Credibility Score (ECS).
    ECS = 0.25 * evidence_independence
        + 0.20 * source_authority
        + 0.20 * evidence_coverage
        + 0.20 * signal_agreement
        + 0.15 * provenance_integrity
    
    Returns an integer between 0 and 100.
    """
    if not evidence and not media_analysis and not provenance_signals:
        return 0

    # 1. Evidence Independence (0.25)
    # Measured by variety of source domains and source types
    if not evidence:
        evidence_independence = 0.0
    else:
        domains = set()
        source_types = set()
        for e in evidence:
            domains.add(e.source_name.lower())
            source_types.add(e.source_type)
        
        domain_factor = min(len(domains) / 4, 1.0)
        type_factor = min(len(source_types) / 3, 1.0)
        evidence_independence = (domain_factor * 0.5) + (type_factor * 0.5)

    # 2. Source Authority (0.20)
    # Average authority of retrieved evidence items
    if not evidence:
        source_authority = 0.3
    else:
        source_authority = sum(e.authority_score for e in evidence) / len(evidence)

    # 3. Evidence Coverage (0.20)
    # Quantity of relevant search results
    if not evidence:
        evidence_coverage = 0.0
    else:
        # 5 or more evidence items = full coverage score
        evidence_coverage = min(len(evidence) / 5, 1.0)

    # 4. Signal Agreement (0.20)
    # Agreement between media authenticity, context consistency, and evidence stance
    if not evidence:
        signal_agreement = 0.5
    else:
        # Determine media stance (pro-claim or anti-claim)
        media_stance = "neutral"
        if media_analysis:
            auth = media_analysis.media_authenticity.assessment
            ctx = media_analysis.context_consistency.assessment
            if auth in ["possible_manipulation", "likely_synthetic"] or ctx == "inconsistent":
                media_stance = "contradicts"
            elif auth == "likely_authentic" and ctx == "consistent":
                media_stance = "supports"
        
        matches = 0
        total_meaningful = 0
        for e in evidence:
            if e.stance in [EvidenceStance.SUPPORTS, EvidenceStance.CONTRADICTS]:
                total_meaningful += 1
                if e.stance == EvidenceStance.SUPPORTS and media_stance == "supports":
                    matches += 1
                elif e.stance == EvidenceStance.CONTRADICTS and media_stance == "contradicts":
                    matches += 1
        
        if total_meaningful == 0:
            signal_agreement = 0.5
        else:
            signal_agreement = matches / total_meaningful

    # 5. Provenance Integrity (0.15)
    # Presence and validity of cryptographic credentials (C2PA) and metadata
    if not provenance_signals:
        provenance_integrity = 0.2
    else:
        score_accum = 0.2
        for s in provenance_signals:
            if s.signal_type == "content_credentials":
                score_accum = max(score_accum, 1.0)
            elif s.signal_type == "exif_metadata":
                score_accum = max(score_accum, 0.8)
            elif s.signal_type == "historical_occurrence":
                score_accum = max(score_accum, 0.6)
        provenance_integrity = score_accum

    # Compute raw ECS (0.0 to 1.0)
    raw_ecs = (
        0.25 * evidence_independence
        + 0.20 * source_authority
        + 0.20 * evidence_coverage
        + 0.20 * signal_agreement
        + 0.15 * provenance_integrity
    )

    ecs_val = int(round(raw_ecs * 100))
    return max(0, min(100, ecs_val))


def fuse_signals(
    evidence: List[EvidenceItem],
    media_analysis: Optional[MediaAnalysisResult],
    provenance_signals: List[ProvenanceSignal],
    pillars: Optional[List] = None,
) -> AssessmentResult:
    """
    Combine all verification signals into a NYASA assessment.
    Returns a non-binary label + NYASA Confidence Score + ECS.
    """
    # 1. Fallback to basic heuristics if pillars are not provided
    if not pillars:
        evidence_score = _compute_evidence_strength(evidence)
        source_score = _compute_source_consistency(evidence)
        provenance_score = _compute_provenance_strength(provenance_signals)
        media_score = _compute_media_score(media_analysis)
        cross_source_score = _compute_cross_source_agreement(evidence)

        raw_confidence = (
            WEIGHTS["evidence_strength"] * evidence_score
            + WEIGHTS["source_consistency"] * source_score
            + WEIGHTS["provenance_strength"] * provenance_score
            + WEIGHTS["media_analysis"] * media_score
            + WEIGHTS["cross_source_agreement"] * cross_source_score
        )
        confidence = max(0.1, min(0.95, raw_confidence))
        label, display_label = _determine_assessment_label(evidence, media_analysis, confidence)
        ecs = compute_ecs(evidence, media_analysis, provenance_signals)
        
        # Build default media/context results
        media_integrity_res = {"label": "UNCERTAIN", "score": 50, "confidence": 50}
        context_integrity_res = {"label": "UNRESOLVED", "score": 50, "confidence": 50}
        
        res = AssessmentResult(
            label=label,
            display_label=display_label,
            confidence=round(confidence, 2),
            confidence_percent=int(round(confidence * 100)),
            ecs=ecs,
        )
        res.media_integrity = media_integrity_res
        res.context_integrity = context_integrity_res
        return res

    # 2. Extract detailed pillar metrics
    p1 = next((p for p in pillars if p.pillar_id == "P1"), None)
    p2 = next((p for p in pillars if p.pillar_id == "P2"), None)
    p3 = next((p for p in pillars if p.pillar_id == "P3"), None)
    p6 = next((p for p in pillars if p.pillar_id == "P6"), None)

    p1_score = p1.signal_score if p1 else 50
    p2_score = p2.signal_score if p2 else 50
    p3_score = p3.signal_score if p3 else 50
    p6_score = p6.signal_score if p6 else 50

    p1_conf = p1.confidence if p1 else 0
    p2_conf = p2.confidence if p2 else 0
    p3_conf = p3.confidence if p3 else 0
    p6_conf = p6.confidence if p6 else 0

    p1_active = (p1 is not None and p1.confidence > 0)
    p2_active = (p2 is not None and p2.confidence > 0)
    p3_active = (p3 is not None and p3.confidence > 0)
    p6_active = (p6 is not None and p6.confidence > 0)

    # 3. Calculate Media Integrity (P1, P2, P3)
    # If no media is provided, Media Integrity is NOT_APPLICABLE/UNCERTAIN.
    has_media = (media_analysis is not None)
    
    if has_media:
        # Weighted media score based on active signals
        media_weight = 0.0
        media_sum = 0.0
        conf_sum = 0.0
        
        if p1_active:
            media_weight += 0.2
            media_sum += p1_score * 0.2
            conf_sum += p1_conf * 0.2
        if p2_active:
            media_weight += 0.3
            media_sum += p2_score * 0.3
            conf_sum += p2_conf * 0.3
        if p3_active:
            media_weight += 0.5
            media_sum += p3_score * 0.5
            conf_sum += p3_conf * 0.5
            
        if media_weight > 0:
            media_score_val = int(round(media_sum / media_weight))
            media_conf_val = int(round(conf_sum / media_weight))
        else:
            media_score_val = 50
            media_conf_val = 0
            
        if media_score_val >= 60:
            media_label = "LIKELY_AUTHENTIC"
        elif media_score_val <= 45:
            media_label = "LIKELY_MANIPULATED"
        else:
            media_label = "UNCERTAIN"
    else:
        media_score_val = 50
        media_conf_val = 0
        media_label = "UNCERTAIN"

    media_integrity_res = {
        "label": media_label,
        "score": media_score_val,
        "confidence": media_conf_val
    }

    # 4. Calculate Context Integrity (P6)
    context_score_val = p6_score
    context_conf_val = p6_conf
    
    p6_status = p6.status if p6 else "UNVERIFIABLE"
    if p6_status == "MISLEADING_CONTEXT":
        context_label = "MISLEADING_CONTEXT"
    elif p6_status == "CONTRADICTED":
        context_label = "CONTRADICTS"
    elif p6_status == "SUPPORTED":
        context_label = "SUPPORTED"
    else:
        context_label = "UNRESOLVED"

    context_integrity_res = {
        "label": context_label,
        "score": context_score_val,
        "confidence": context_conf_val
    }

    # 5. Combined Decision Tree (Milestone 2 Taxonomy)
    display_label = "Inconclusive"
    final_label = AssessmentLabel.INCONCLUSIVE

    is_synthetic = False
    if media_analysis:
        auth_status = media_analysis.media_authenticity.assessment
        if auth_status == "likely_synthetic":
            is_synthetic = True

    if has_media and media_label == "LIKELY_MANIPULATED":
        if is_synthetic:
            final_label = AssessmentLabel.LIKELY_SYNTHETIC
            display_label = "Likely Synthetic (AI-Generated)"
        else:
            final_label = AssessmentLabel.LIKELY_MANIPULATED
            display_label = "Likely Manipulated Image"
    elif context_label == "CONTRADICTS":
        final_label = AssessmentLabel.CLAIM_CONTRADICTED
        display_label = "Claim Contradicted by Evidence"
    elif has_media and media_label == "LIKELY_AUTHENTIC" and context_label == "SUPPORTED":
        final_label = AssessmentLabel.LIKELY_AUTHENTIC_AND_SUPPORTED
        display_label = "Likely Authentic & Supported"
    elif has_media and media_label == "LIKELY_AUTHENTIC" and context_label == "MISLEADING_CONTEXT":
        final_label = AssessmentLabel.LIKELY_AUTHENTIC_BUT_MISLEADING_CONTEXT
        display_label = "Authentic Image, Misleading Context"
    elif context_label == "SUPPORTED":
        final_label = AssessmentLabel.LIKELY_SUPPORTED
        display_label = "Likely Supported"
    elif context_label == "UNRESOLVED":
        if not evidence:
            final_label = AssessmentLabel.INSUFFICIENT_EVIDENCE
            display_label = "Insufficient Evidence"
        else:
            # Check for conflict
            supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
            contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]
            if supporting and contradicting:
                final_label = AssessmentLabel.CONFLICTING_EVIDENCE
                display_label = "Conflicting Evidence"
            else:
                final_label = AssessmentLabel.INCONCLUSIVE
                display_label = "Inconclusive"

    # Overall Confidence Calculation
    # Weights: P1 (15%), P2 (20%), P3 (30%), P6 (35%)
    # Computed dynamically based on available metrics
    total_weight = 0.0
    weighted_score_sum = 0.0
    
    if p1_active:
        total_weight += 0.15
        weighted_score_sum += 0.15 * (float(p1_score) / 100.0)
    if p2_active:
        total_weight += 0.20
        weighted_score_sum += 0.20 * (float(p2_score) / 100.0)
    if p3_active:
        total_weight += 0.30
        weighted_score_sum += 0.30 * (float(p3_score) / 100.0)
    if p6_active:
        total_weight += 0.35
        weighted_score_sum += 0.35 * (float(p6_score) / 100.0)
        
    if total_weight > 0:
        raw_confidence = weighted_score_sum / total_weight
    else:
        raw_confidence = 0.5

    confidence = max(0.1, min(0.95, raw_confidence))
    ecs = compute_ecs(evidence, media_analysis, provenance_signals)

    res = AssessmentResult(
        label=final_label,
        display_label=display_label,
        confidence=round(confidence, 2),
        confidence_percent=int(round(confidence * 100)),
        ecs=ecs,
    )
    res.media_integrity = media_integrity_res
    res.context_integrity = context_integrity_res
    return res
