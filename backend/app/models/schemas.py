"""
NYASA Pydantic Schemas
All data models for the verification pipeline.

Key design decisions:
- Media authenticity and context consistency are SEPARATE first-class outputs
- Confidence is a "NYASA Confidence Score" (weighted verification signals), not a calibrated probability
- No TRUE/FALSE anywhere — only non-binary assessment labels
- Evidence items are always traceable to source
- Uncertainty is structured, not a generic disclaimer
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime


# ─── Assessment Labels (non-binary, never TRUE/FALSE) ───

class AssessmentLabel(str, Enum):
    STRONGLY_SUPPORTED = "strongly_supported"
    LIKELY_SUPPORTED = "likely_supported"
    INCONCLUSIVE = "inconclusive"
    LIKELY_MISLEADING = "likely_misleading"
    STRONGLY_CONTRADICTED = "strongly_contradicted"
    MANIPULATION_SIGNALS_DETECTED = "manipulation_signals_detected"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class UncertaintyLevel(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class EvidenceStance(str, Enum):
    SUPPORTS = "supports"
    CONTRADICTS = "contradicts"
    CONTEXT = "context"
    UNRESOLVED = "unresolved"


class SourceType(str, Enum):
    GOVERNMENT = "government"
    NEWS_MAJOR = "news_major"
    NEWS_LOCAL = "news_local"
    FACT_CHECKER = "fact_checker"
    ACADEMIC = "academic"
    OFFICIAL_ORG = "official_org"
    BLOG = "blog"
    SOCIAL_MEDIA = "social_media"
    FORUM = "forum"
    UNKNOWN = "unknown"


class MediaQuality(str, Enum):
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    VERY_LOW = "very_low"


# ─── Claim Extraction ───

class ExtractedClaim(BaseModel):
    """Structured claim extracted from user input."""
    original_text: str = Field(..., description="The original claim text as submitted")
    normalized_claim: str = Field(..., description="Clean, normalized version of the claim")
    entities: List[str] = Field(default_factory=list, description="Named entities (people, places, orgs)")
    event_type: Optional[str] = Field(None, description="Type of event (flood, earthquake, protest, etc.)")
    location: Optional[str] = Field(None, description="Geographic location referenced")
    time_reference: Optional[str] = Field(None, description="Temporal reference (today, yesterday, date)")
    key_assertion: str = Field(..., description="The core verifiable assertion")
    atomic_claims: List[str] = Field(default_factory=list, description="Decomposed atomic claims")


# ─── Media Analysis (authenticity ≠ context) ───

class MediaSignal(BaseModel):
    """A single signal from media analysis."""
    signal_type: str = Field(..., description="Type: manipulation_indicator, metadata_anomaly, synthetic_indicator, etc.")
    description: str = Field(..., description="Human-readable description of the signal")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Signal confidence (0-1)")


class MediaAuthenticity(BaseModel):
    """Media-level authenticity assessment — is the media itself manipulated/synthetic?"""
    assessment: str = Field(..., description="E.g. 'likely_authentic', 'possible_manipulation', 'likely_synthetic'")
    signals: List[MediaSignal] = Field(default_factory=list)
    description: str = Field("", description="Human-readable summary")


class ContextConsistency(BaseModel):
    """Claim/context consistency — does the claim match the media content?"""
    assessment: str = Field(..., description="E.g. 'consistent', 'inconsistent', 'unverifiable'")
    signals: List[MediaSignal] = Field(default_factory=list)
    description: str = Field("", description="Human-readable summary")


class MediaAnalysisResult(BaseModel):
    """
    Complete media analysis result.
    Critically separates media authenticity from context consistency.
    """
    media_authenticity: MediaAuthenticity
    context_consistency: ContextConsistency
    visual_description: str = Field("", description="What the image/media depicts")
    ocr_text: Optional[str] = Field(None, description="Text extracted via OCR if present")
    media_quality: MediaQuality = Field(MediaQuality.MODERATE)


# ─── Provenance Signals ───

class ProvenanceSignal(BaseModel):
    """
    A provenance signal — carefully distinguished from verified provenance.
    A search result is NOT 'verified provenance' — it's a discovered historical occurrence.
    """
    signal_type: str = Field(..., description="exif_metadata, historical_occurrence, source_attribution, content_credentials")
    description: str = Field(...)
    source: Optional[str] = Field(None)
    date_found: Optional[str] = Field(None, description="Date associated with historical occurrence")
    confidence: float = Field(0.5, ge=0.0, le=1.0)
    url: Optional[str] = Field(None)


# ─── Evidence Items ───

class EvidenceItem(BaseModel):
    """A single piece of retrieved evidence, always traceable to source."""
    evidence_id: str = Field(..., description="Unique evidence identifier")
    title: str = Field(...)
    snippet: str = Field(..., description="Relevant excerpt")
    source_name: str = Field(...)
    source_type: SourceType = Field(SourceType.UNKNOWN)
    source_url: str = Field(...)
    published_date: Optional[str] = Field(None)
    retrieved_at: str = Field(..., description="ISO timestamp of retrieval")
    stance: EvidenceStance = Field(EvidenceStance.UNRESOLVED)
    relevance_score: float = Field(0.5, ge=0.0, le=1.0)
    authority_score: float = Field(0.5, ge=0.0, le=1.0)
    stance_reasoning: str = Field("", description="Why this evidence was classified with this stance")


# ─── Uncertainty ───

class UncertaintyFactor(BaseModel):
    """A specific factor contributing to uncertainty."""
    factor: str = Field(..., description="E.g. 'missing_metadata', 'source_conflict', 'low_media_quality'")
    description: str = Field(..., description="Human-readable explanation")
    impact: str = Field("moderate", description="low, moderate, high")


class UncertaintyResult(BaseModel):
    """Structured uncertainty — not a generic disclaimer."""
    level: UncertaintyLevel = Field(...)
    factors: List[UncertaintyFactor] = Field(default_factory=list)
    summary: str = Field(..., description="One-sentence uncertainty summary")
    what_would_help: List[str] = Field(
        default_factory=list,
        description="What additional evidence would reduce uncertainty"
    )


# ─── 6 Pillars of NYASA ───

class PillarResult(BaseModel):
    """One of the 6 pillars of NYASA's evidence-based verification architecture."""
    name: str = Field(..., description="Name of the pillar")
    status: str = Field(..., description="Status description (e.g. 'available', 'suspicious', 'valid')")
    score: Optional[float] = Field(None, description="Score associated with the pillar (0.0 to 1.0) if applicable")
    summary: str = Field(..., description="Summary explanation of findings for this pillar")
    details: List[str] = Field(default_factory=list, description="Specific details/signals extracted for this pillar")


# ─── Final Assessment ───

class AssessmentResult(BaseModel):
    """
    The complete NYASA assessment.
    Confidence is a 'NYASA Confidence Score' derived from weighted verification signals.
    It is NOT a scientifically calibrated probability.
    
    ECS (Evidence Credibility Score) measures the quality and coverage of the evidence.
    """
    label: AssessmentLabel = Field(...)
    display_label: str = Field(..., description="Human-readable label, e.g. 'Likely Misleading'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="NYASA Confidence Score (0-1)")
    confidence_percent: int = Field(..., ge=0, le=100, description="Confidence as percentage for display")
    ecs: int = Field(..., ge=0, le=100, description="Evidence Credibility Score (ECS) from 0 to 100")


# ─── Complete Verification Response ───

class VerificationResponse(BaseModel):
    """The complete NYASA verification report."""
    verification_id: str = Field(...)
    status: str = Field("completed")
    timestamp: str = Field(...)

    # Input echo
    claim_text: str = Field(...)
    has_media: bool = Field(False)

    # Pipeline outputs
    extracted_claim: ExtractedClaim
    media_analysis: Optional[MediaAnalysisResult] = None
    provenance_signals: List[ProvenanceSignal] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)

    # 6 Pillars Analysis
    pillars: List[PillarResult] = Field(default_factory=list, description="The 6 pillars of NYASA verification")

    # Evidence summary
    supporting_count: int = Field(0)
    contradicting_count: int = Field(0)
    context_count: int = Field(0)
    unresolved_count: int = Field(0)

    # Assessment
    assessment: AssessmentResult
    uncertainty: UncertaintyResult

    # Explanation
    explanation: str = Field(..., description="Evidence-grounded explanation")
    key_findings: List[str] = Field(default_factory=list, description="Bullet-point findings")
    recommended_action: str = Field(...)
    limitations: List[str] = Field(default_factory=list)

    # Scoring transparency
    scoring_note: str = Field(
        default="The NYASA Confidence Score is derived from weighted verification signals "
                "including evidence strength, source consistency, provenance indicators, "
                "media analysis, and cross-source agreement. The Evidence Credibility Score (ECS) "
                "measures the quality, coverage, and independence of the underlying evidence. "
                "Both are prototype heuristics, not scientifically calibrated probabilities.",
        description="Transparency note about how confidence and ECS are calculated"
    )
