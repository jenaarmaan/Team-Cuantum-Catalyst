"""
NYASA Evidence-Grounded Explanation Engine
Generates human-readable explanations constrained to retrieved evidence.

CRITICAL RULE: The LLM CANNOT invent evidence.
It receives ONLY structured evidence objects and must explain ONLY what was found.
"""

import json
from typing import List, Optional
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import (
    EvidenceItem,
    EvidenceStance,
    MediaAnalysisResult,
    UncertaintyResult,
    AssessmentResult,
    ProvenanceSignal,
    ExtractedClaim,
)


genai.configure(api_key=settings.gemini_api_key)


EXPLANATION_PROMPT = """You are the explanation engine for NYASA, an evidence-based verification system.

Your job is to generate a clear, honest explanation for an ordinary user.

RULES:
1. You may ONLY reference the evidence provided below. Do NOT invent or hallucinate evidence.
2. Do NOT use the words "TRUE" or "FALSE" or "FAKE" or "REAL" as standalone verdicts.
3. Explain what was found, what conflicts, and what remains uncertain.
4. Use simple language a non-expert can understand.
5. Be specific about sources and findings.

CLAIM BEING VERIFIED:
{claim}

ASSESSMENT: {assessment_label} (Confidence: {confidence}%)

MEDIA ANALYSIS:
- Media Authenticity: {media_auth}
- Context Consistency: {context_cons}
- Visual Description: {visual_desc}

EVIDENCE ITEMS:
{evidence_text}

PROVENANCE SIGNALS:
{provenance_text}

UNCERTAINTY:
{uncertainty_text}

Generate a JSON response:
{{
  "explanation": "A 2-4 sentence evidence-grounded explanation of why NYASA reached this assessment. Reference specific evidence.",
  "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommended_action": "A single recommended next action for the user",
  "limitations": ["Limitation 1", "Limitation 2"]
}}
"""


def _format_evidence_for_prompt(evidence: List[EvidenceItem]) -> str:
    """Format evidence items for the LLM prompt."""
    if not evidence:
        return "No external evidence was found."

    lines = []
    for i, e in enumerate(evidence, 1):
        stance_label = {
            EvidenceStance.SUPPORTS: "SUPPORTS claim",
            EvidenceStance.CONTRADICTS: "CONTRADICTS claim",
            EvidenceStance.CONTEXT: "CONTEXTUAL",
            EvidenceStance.UNRESOLVED: "UNRESOLVED",
        }.get(e.stance, "UNRESOLVED")

        lines.append(
            f"[{i}] {e.title}\n"
            f"    Source: {e.source_name} ({e.source_type.value})\n"
            f"    Stance: {stance_label}\n"
            f"    Reasoning: {e.stance_reasoning}\n"
            f"    Snippet: {e.snippet[:200]}..."
        )
    return "\n".join(lines)


def _format_provenance_for_prompt(provenance: List[ProvenanceSignal]) -> str:
    """Format provenance signals for the prompt."""
    if not provenance:
        return "No provenance signals available."

    lines = []
    for s in provenance:
        lines.append(f"- {s.signal_type}: {s.description} (confidence: {s.confidence})")
    return "\n".join(lines)


async def generate_explanation(
    extracted_claim: ExtractedClaim,
    assessment: AssessmentResult,
    media_analysis: Optional[MediaAnalysisResult],
    evidence: List[EvidenceItem],
    provenance_signals: List[ProvenanceSignal],
    uncertainty: UncertaintyResult,
) -> dict:
    """
    Generate an evidence-grounded explanation.
    The LLM summarizes ONLY the evidence that was actually retrieved.
    """
    try:
        model = genai.GenerativeModel(settings.gemini_model)

        # Prepare media analysis text
        if media_analysis:
            media_auth = f"{media_analysis.media_authenticity.assessment} — {media_analysis.media_authenticity.description}"
            context_cons = f"{media_analysis.context_consistency.assessment} — {media_analysis.context_consistency.description}"
            visual_desc = media_analysis.visual_description
        else:
            media_auth = "No media provided"
            context_cons = "No media provided"
            visual_desc = "N/A"

        # Prepare uncertainty text
        uncertainty_text = f"Level: {uncertainty.level.value}\n"
        for f in uncertainty.factors:
            uncertainty_text += f"- {f.factor}: {f.description}\n"

        prompt = EXPLANATION_PROMPT.format(
            claim=extracted_claim.normalized_claim,
            assessment_label=assessment.display_label,
            confidence=assessment.confidence_percent,
            media_auth=media_auth,
            context_cons=context_cons,
            visual_desc=visual_desc,
            evidence_text=_format_evidence_for_prompt(evidence),
            provenance_text=_format_provenance_for_prompt(provenance_signals),
            uncertainty_text=uncertainty_text,
        )

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

        response_text = response.text.strip()
        if "```" in response_text:
            import re
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1).strip()

        parsed = json.loads(response_text)

        return {
            "explanation": parsed.get("explanation", "Assessment could not be fully explained."),
            "key_findings": parsed.get("key_findings", []),
            "recommended_action": parsed.get(
                "recommended_action",
                "Exercise caution before sharing. Seek additional verification."
            ),
            "limitations": parsed.get("limitations", []),
        }

    except Exception as e:
        print(f"[NYASA] Explanation generation error: {e}")
        # Fallback: generate explanation from structured data
        return _generate_fallback_explanation(
            extracted_claim, assessment, media_analysis, evidence, uncertainty
        )


def _generate_fallback_explanation(
    claim: ExtractedClaim,
    assessment: AssessmentResult,
    media_analysis: Optional[MediaAnalysisResult],
    evidence: List[EvidenceItem],
    uncertainty: UncertaintyResult,
) -> dict:
    """Generate a basic explanation without LLM if Gemini fails."""
    supporting = [e for e in evidence if e.stance == EvidenceStance.SUPPORTS]
    contradicting = [e for e in evidence if e.stance == EvidenceStance.CONTRADICTS]

    findings = []
    if supporting:
        findings.append(f"{len(supporting)} source(s) provide supporting evidence.")
    if contradicting:
        findings.append(f"{len(contradicting)} source(s) provide contradicting evidence.")
    if media_analysis:
        findings.append(f"Media authenticity: {media_analysis.media_authenticity.assessment}")
        findings.append(f"Context consistency: {media_analysis.context_consistency.assessment}")

    explanation = (
        f"NYASA assessed this claim as '{assessment.display_label}' with "
        f"{assessment.confidence_percent}% confidence. "
        f"{'Evidence was found both supporting and contradicting the claim. ' if supporting and contradicting else ''}"
        f"{uncertainty.summary}"
    )

    return {
        "explanation": explanation,
        "key_findings": findings,
        "recommended_action": "Exercise caution before sharing. Seek additional independent verification.",
        "limitations": [f.description for f in uncertainty.factors],
    }
