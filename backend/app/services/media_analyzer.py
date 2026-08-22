"""
NYASA Media Analysis Service
Uses Gemini Vision to analyze uploaded images.

CRITICAL DESIGN DECISIONS:
1. Media authenticity and context consistency are SEPARATE outputs
2. Manipulation signals are SIGNALS, not truth labels
3. A "likely authentic" media result does NOT mean the claim is true
4. Gemini's assessment feeds the fusion engine — it does not determine the final verdict
"""

import json
import base64
import google.generativeai as genai
from PIL import Image
import io
from app.core.config import settings
from app.models.schemas import (
    MediaAnalysisResult,
    MediaAuthenticity,
    ContextConsistency,
    MediaSignal,
    MediaQuality,
)


genai.configure(api_key=settings.gemini_api_key)


MEDIA_ANALYSIS_PROMPT = """You are a media forensics analyst for NYASA, a verification system.

Analyze this image and the associated claim. You must provide TWO SEPARATE assessments:

1. MEDIA AUTHENTICITY: Does the image itself show signs of manipulation, AI generation, or synthetic creation?
   - Look for: visual inconsistencies, unnatural lighting, artifact patterns, blending edges, AI-generation tells, copy-paste regions, impossible geometry/physics
   - This is about THE IMAGE ITSELF, not the claim

2. CONTEXT CONSISTENCY: Does the image content appear consistent with what is being claimed about it?
   - Look for: Does the scene match the claimed event? Are there visible clues about location/time that conflict with the claim?
   - A real photograph from 2019 being claimed as "today" would be: media=authentic, context=inconsistent

3. VISUAL DESCRIPTION: Describe what the image actually shows

4. OCR TEXT: Extract any visible text in the image (or null if none)

5. MEDIA QUALITY: Rate the image quality as high, moderate, low, or very_low

THE CLAIM BEING MADE ABOUT THIS IMAGE:
{claim}

Respond ONLY with valid JSON:
{{
  "media_authenticity": {{
    "assessment": "likely_authentic" or "possible_manipulation" or "likely_synthetic" or "unable_to_determine",
    "signals": [
      {{"signal_type": "...", "description": "...", "confidence": 0.0-1.0}}
    ],
    "description": "One sentence summary"
  }},
  "context_consistency": {{
    "assessment": "consistent" or "inconsistent" or "partially_consistent" or "unverifiable",
    "signals": [
      {{"signal_type": "...", "description": "...", "confidence": 0.0-1.0}}
    ],
    "description": "One sentence summary"
  }},
  "visual_description": "...",
  "ocr_text": "..." or null,
  "media_quality": "high" or "moderate" or "low" or "very_low"
}}

IMPORTANT:
- Do NOT conflate media authenticity with claim truth
- Manipulation signals are SIGNALS, not certainties
- If you cannot determine something, say so
- Be specific about what you observe, not what you assume
"""


async def analyze_media(image_bytes: bytes, claim_text: str) -> MediaAnalysisResult:
    """
    Analyze an image for media authenticity and context consistency.
    These are SEPARATE dimensions — a key NYASA differentiator.
    """
    try:
        model = genai.GenerativeModel(settings.gemini_model)

        # Prepare the image for Gemini
        image = Image.open(io.BytesIO(image_bytes))

        # Get image format info for quality assessment
        img_format = image.format or "UNKNOWN"
        img_size = image.size

        prompt = MEDIA_ANALYSIS_PROMPT.format(claim=claim_text)

        response = model.generate_content(
            [prompt, image],
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2048,
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

        # Build media authenticity
        auth_data = parsed.get("media_authenticity", {})
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

        # Build context consistency
        ctx_data = parsed.get("context_consistency", {})
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

        # Determine media quality based on resolution
        quality = parsed.get("media_quality", "moderate")
        quality_map = {
            "high": MediaQuality.HIGH,
            "moderate": MediaQuality.MODERATE,
            "low": MediaQuality.LOW,
            "very_low": MediaQuality.VERY_LOW,
        }

        return MediaAnalysisResult(
            media_authenticity=media_auth,
            context_consistency=context_cons,
            visual_description=parsed.get("visual_description", ""),
            ocr_text=parsed.get("ocr_text"),
            media_quality=quality_map.get(quality, MediaQuality.MODERATE),
        )

    except Exception as e:
        print(f"[NYASA] Media analysis error: {e}")
        # Graceful degradation
        return MediaAnalysisResult(
            media_authenticity=MediaAuthenticity(
                assessment="unable_to_determine",
                signals=[],
                description="Media analysis encountered an error. This signal is unavailable.",
            ),
            context_consistency=ContextConsistency(
                assessment="unverifiable",
                signals=[],
                description="Context consistency could not be assessed due to an analysis error.",
            ),
            visual_description="Analysis unavailable",
            ocr_text=None,
            media_quality=MediaQuality.MODERATE,
        )
