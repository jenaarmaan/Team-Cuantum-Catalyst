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
  "normalized_claim": "...",
  "entities": ["...", "..."],
  "event_type": "..." or null,
  "location": "..." or null,
  "time_reference": "..." or null,
  "key_assertion": "...",
  "atomic_claims": ["...", "..."]
}

USER CLAIM:
"""


async def extract_claim(claim_text: str) -> ExtractedClaim:
    """
    Extract structured claim data from raw user text.
    Uses Gemini for NLP extraction.
    """
    try:
        model = genai.GenerativeModel(settings.gemini_model)

        response = model.generate_content(
            CLAIM_EXTRACTION_PROMPT + claim_text,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=1024,
            ),
        )

        # Parse the JSON response
        response_text = response.text.strip()

        # Handle markdown code blocks if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])

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
