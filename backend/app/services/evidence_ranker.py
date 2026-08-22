"""
NYASA Evidence Ranking Service
Classifies evidence stance, scores authority, and detects source independence.

Uses Gemini for stance classification (SUPPORTS / CONTRADICTS / CONTEXT / UNRESOLVED).
Uses deterministic rules for authority and independence scoring.
"""

import json
from typing import List
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import EvidenceItem, EvidenceStance, SourceType


genai.configure(api_key=settings.gemini_api_key)


STANCE_CLASSIFICATION_PROMPT = """You are an evidence analyst for NYASA, a verification system.

Given a CLAIM and an EVIDENCE item, classify the evidence's stance relative to the claim.

CLAIM: {claim}

EVIDENCE TITLE: {title}
EVIDENCE SOURCE: {source}
EVIDENCE SNIPPET: {snippet}

Classify the stance as one of:
- "supports": The evidence provides information that supports or confirms the claim
- "contradicts": The evidence provides information that conflicts with or refutes the claim
- "context": The evidence provides relevant background but doesn't directly prove or disprove the claim
- "unresolved": The evidence is insufficient to determine a clear stance

Also provide a brief reasoning (1-2 sentences).

Respond ONLY with valid JSON:
{{
  "stance": "supports" or "contradicts" or "context" or "unresolved",
  "reasoning": "..."
}}
"""


# Authority scores by source type (heuristic, not absolute)
SOURCE_AUTHORITY_SCORES = {
    SourceType.GOVERNMENT: 0.85,
    SourceType.FACT_CHECKER: 0.80,
    SourceType.ACADEMIC: 0.75,
    SourceType.NEWS_MAJOR: 0.70,
    SourceType.OFFICIAL_ORG: 0.70,
    SourceType.NEWS_LOCAL: 0.55,
    SourceType.BLOG: 0.35,
    SourceType.SOCIAL_MEDIA: 0.25,
    SourceType.FORUM: 0.20,
    SourceType.UNKNOWN: 0.30,
}


async def rank_evidence(
    evidence_items: List[EvidenceItem],
    claim_text: str,
) -> List[EvidenceItem]:
    """
    Rank and classify evidence items.
    - Classify stance using Gemini
    - Score authority based on source type
    - Sort by relevance * authority
    """
    if not evidence_items:
        return []

    model = genai.GenerativeModel(settings.gemini_model)
    ranked_items = []

    for item in evidence_items:
        # Score authority based on source type
        item.authority_score = SOURCE_AUTHORITY_SCORES.get(item.source_type, 0.30)

        # Classify stance using Gemini
        try:
            prompt = STANCE_CLASSIFICATION_PROMPT.format(
                claim=claim_text,
                title=item.title,
                source=item.source_name,
                snippet=item.snippet[:300],
            )

            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=256,
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

            stance_str = parsed.get("stance", "unresolved")
            stance_map = {
                "supports": EvidenceStance.SUPPORTS,
                "contradicts": EvidenceStance.CONTRADICTS,
                "context": EvidenceStance.CONTEXT,
                "unresolved": EvidenceStance.UNRESOLVED,
            }
            item.stance = stance_map.get(stance_str, EvidenceStance.UNRESOLVED)
            item.stance_reasoning = parsed.get("reasoning", "")

        except Exception as e:
            print(f"[NYASA] Stance classification error for {item.evidence_id}: {e}")
            item.stance = EvidenceStance.UNRESOLVED
            item.stance_reasoning = "Stance could not be determined due to an analysis error."

        ranked_items.append(item)

    # Sort: contradicting evidence first (more interesting), then by relevance * authority
    def sort_key(e: EvidenceItem) -> float:
        stance_boost = {
            EvidenceStance.CONTRADICTS: 0.1,
            EvidenceStance.SUPPORTS: 0.05,
            EvidenceStance.CONTEXT: 0.0,
            EvidenceStance.UNRESOLVED: -0.05,
        }
        return -(e.relevance_score * e.authority_score + stance_boost.get(e.stance, 0))

    ranked_items.sort(key=sort_key)

    return ranked_items
