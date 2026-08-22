"""
NYASA Claim Extraction Service
Uses Gemini to extract structured claims from user input text.

Extracts: entities, event type, location, time reference, key assertion, atomic claims.
"""

import json
import google.generativeai as genai
from app.core.config import settings
from app.models.schemas import ExtractedClaim


# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


CLAIM_EXTRACTION_PROMPT = """You are a claim extraction engine for a verification system called NYASA.

Given a user's claim about a piece of media or an event, extract the following structured information:

1. normalized_claim: A clean, single-sentence version of what is being claimed
2. entities: Named entities (people, places, organizations, specific things)
3. event_type: The type of event (flood, earthquake, protest, accident, statement, announcement, etc.) or null
4. location: The geographic location mentioned, or null
5. time_reference: Any temporal reference (today, yesterday, a specific date, etc.) or null
6. key_assertion: The single most important verifiable assertion
7. atomic_claims: Break the claim into independently verifiable atomic statements (list of strings)

Respond ONLY with valid JSON in this exact format:
{
  "normalized_claim": "The earth is round",
  "entities": ["Earth"],
  "event_type": "scientific_fact",
  "location": null,
  "time_reference": null,
  "key_assertion": "The shape of the earth is round",
  "atomic_claims": ["The earth is round"]
}

USER CLAIM:
"""


async def extract_claim(claim_text: str) -> ExtractedClaim:
    """
    Extract structured claim data from raw user text.
    Uses Gemini for NLP extraction.
    """
    import os
    gemini_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not gemini_key or gemini_key.strip() == "":
        print("[NYASA] Claim extraction skipped: Gemini API credentials are not configured.")
        return ExtractedClaim(
            original_text=claim_text,
            normalized_claim=claim_text,
            entities=[],
            event_type=None,
            location=None,
            time_reference=None,
            key_assertion=claim_text,
            atomic_claims=[claim_text],
        )

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(settings.gemini_model)

        response = model.generate_content(
            CLAIM_EXTRACTION_PROMPT + claim_text,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
            ),
        )

        # Parse the JSON response
        response_text = response.text.strip()

        # Robust JSON extraction (removes markdown code blocks if model returned them anyway)
        if "```" in response_text:
            # Extract content between first ```json and ``` or just ```
            import re
            match = re.search(r"```(?:json)?\s*(.*?)\s*```", response_text, re.DOTALL)
            if match:
                response_text = match.group(1).strip()

        parsed = json.loads(response_text)

        return ExtractedClaim(
            original_text=claim_text,
            normalized_claim=parsed.get("normalized_claim", claim_text),
            entities=parsed.get("entities", []),
            event_type=parsed.get("event_type"),
            location=parsed.get("location"),
            time_reference=parsed.get("time_reference"),
            key_assertion=parsed.get("key_assertion", claim_text),
            atomic_claims=parsed.get("atomic_claims", [claim_text]),
        )

    except Exception as e:
        # Graceful degradation: return basic extraction if Gemini fails
        print(f"[NYASA] Claim extraction error: {e}")
        return ExtractedClaim(
            original_text=claim_text,
            normalized_claim=claim_text,
            entities=[],
            event_type=None,
            location=None,
            time_reference=None,
            key_assertion=claim_text,
            atomic_claims=[claim_text],
        )
