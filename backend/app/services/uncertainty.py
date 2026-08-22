"""
NYASA Uncertainty Engine
Determines uncertainty from identifiable system conditions — NOT a generic disclaimer.

Uncertainty is separate from confidence:
- Confidence: How strongly does available evidence support the assessment?
- Uncertainty: How incomplete/unreliable is the available information?
"""

from typing import List, Optional
from app.models.schemas import (
    UncertaintyResult,
    UncertaintyLevel,
    UncertaintyFactor,
    EvidenceItem,
    EvidenceStance,
    MediaAnalysisResult,
    MediaQuality,
    ProvenanceSignal,
)


def calculate_uncertainty(
    evidence: List[EvidenceItem],
    media_analysis: Optional[MediaAnalysisResult],
    provenance_signals: List[ProvenanceSignal],
    claim_has_location: bool = False,
    claim_has_time: bool = False,
) -> UncertaintyResult:
    """
    Calculate structured uncertainty from measurable conditions.
    Each factor is explicitly identified and described.
    """
    factors: List[UncertaintyFactor] = []
    what_would_help: List[str] = []
    uncertainty_score = 0.0

    # ── Factor 1: Evidence coverage ──
    if not evidence:
        factors.append(UncertaintyFactor(
            factor="no_evidence_found",
            description="No relevant external evidence was found for this claim.",
            impact="high",
        ))
        what_would_help.append("Access to more comprehensive search sources")
        uncertainty_score += 0.3
    elif len(evidence) < 3:
        factors.append(UncertaintyFactor(
            factor="limited_evidence",
            description=f"Only {len(evidence)} evidence item(s) found. Limited evidence coverage.",
            impact="moderate",
        ))
        what_would_help.append("Additional independent sources covering this topic")
        uncertainty_score += 0.15

    # ── Factor 2: Source conflicts ──
    if evidence:
        supporting = sum(1 for e in evidence if e.stance == EvidenceStance.SUPPORTS)
        contradicting = sum(1 for e in evidence if e.stance == EvidenceStance.CONTRADICTS)
        if supporting > 0 and contradicting > 0:
            factors.append(UncertaintyFactor(
                factor="source_conflict",
                description=f"Sources disagree: {supporting} supporting vs {contradicting} contradicting.",
                impact="high" if min(supporting, contradicting) >= 2 else "moderate",
            ))
            what_would_help.append("Authoritative primary source to resolve the conflict")
            uncertainty_score += 0.2

    # ── Factor 3: Missing provenance ──
    if not provenance_signals:
        factors.append(UncertaintyFactor(
            factor="no_provenance",
            description="No provenance information available. The original source could not be established.",
            impact="moderate",
        ))
        what_would_help.append("Original source or publication history of the media")
        uncertainty_score += 0.15

    # ── Factor 4: Media quality ──
    if media_analysis and media_analysis.media_quality in [MediaQuality.LOW, MediaQuality.VERY_LOW]:
        factors.append(UncertaintyFactor(
            factor="low_media_quality",
            description="The uploaded media is low quality, which reduces the reliability of visual analysis.",
            impact="moderate",
        ))
        what_would_help.append("Higher resolution version of the image/media")
        uncertainty_score += 0.1

    # ── Factor 5: Media analysis inconclusive ──
    if media_analysis and media_analysis.media_authenticity.assessment == "unable_to_determine":
        factors.append(UncertaintyFactor(
            factor="media_analysis_inconclusive",
            description="Media authenticity could not be reliably assessed.",
            impact="moderate",
        ))
        what_would_help.append("Original, uncompressed version of the media")
        uncertainty_score += 0.1

    # ── Factor 6: Context unverifiable ──
    if media_analysis and media_analysis.context_consistency.assessment == "unverifiable":
        factors.append(UncertaintyFactor(
            factor="context_unverifiable",
            description="The claimed context could not be verified or refuted with available information.",
            impact="moderate",
        ))
        what_would_help.append("Additional context about when and where the media was originally captured")
        uncertainty_score += 0.1

    # ── Factor 7: Temporal claim without verification ──
    if claim_has_time and not any(
        s.signal_type == "historical_occurrence" for s in provenance_signals
    ):
        factors.append(UncertaintyFactor(
            factor="temporal_claim_unverified",
            description="The claim references a specific time, but the timing could not be independently verified.",
            impact="low",
        ))
        uncertainty_score += 0.05

    # ── Factor 8: Low source authority ──
    if evidence:
        avg_authority = sum(e.authority_score for e in evidence) / len(evidence)
        if avg_authority < 0.4:
            factors.append(UncertaintyFactor(
                factor="low_source_authority",
                description="Available sources have relatively low authority scores.",
                impact="moderate",
            ))
            what_would_help.append("Evidence from government, academic, or major news sources")
            uncertainty_score += 0.1

    # ── Determine overall level ──
    if uncertainty_score >= 0.4:
        level = UncertaintyLevel.HIGH
    elif uncertainty_score >= 0.2:
        level = UncertaintyLevel.MODERATE
    else:
        level = UncertaintyLevel.LOW

    # ── Generate summary ──
    if not factors:
        summary = "Uncertainty is low. The available evidence provides reasonable coverage."
    elif level == UncertaintyLevel.HIGH:
        top_factors = [f.description for f in factors if f.impact == "high"]
        summary = "Significant uncertainty remains. " + (top_factors[0] if top_factors else factors[0].description)
    else:
        summary = f"Moderate uncertainty due to {len(factors)} factor(s). " + factors[0].description

    return UncertaintyResult(
        level=level,
        factors=factors,
        summary=summary,
        what_would_help=what_would_help,
    )
