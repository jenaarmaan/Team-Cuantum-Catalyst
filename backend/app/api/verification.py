"""
NYASA Verification API
POST /api/v1/verify — accepts image + claim, returns complete NYASA assessment.
"""

import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from PIL import Image

from app.core.config import settings
from app.models.schemas import VerificationResponse
from app.services.pipeline import run_verification

router = APIRouter(prefix="/api/v1", tags=["verification"])


ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}


@router.post("/verify", response_model=VerificationResponse)
async def verify_content(
    claim: str = Form(..., max_length=10000, description="The claim to verify"),
    image: UploadFile | None = File(None, description="Optional image to analyze"),
):
    """
    Submit content for NYASA verification.

    Accepts:
    - A textual claim (required)
    - An optional image (JPEG, PNG, WebP)

    Returns a complete NYASA verification report with:
    - Extracted claim
    - Media analysis (authenticity + context consistency)
    - Evidence (supporting, contradicting, contextual)
    - NYASA Confidence Score
    - Structured uncertainty
    - Evidence-grounded explanation
    - Recommended action

    NYASA never returns TRUE/FALSE. Every assessment includes evidence, confidence, and uncertainty.
    """

    # Validate claim
    if not claim or not claim.strip():
        raise HTTPException(status_code=400, detail="A claim is required for verification.")

    claim_text = claim.strip()

    # Validate and read image if provided
    image_bytes = None
    if image:
        # Check MIME type
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format: {image.content_type}. "
                       f"Supported: JPEG, PNG, WebP, GIF, BMP.",
            )

        # Read and validate size
        image_bytes = await image.read()
        if len(image_bytes) > settings.max_image_size_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large. Maximum size: {settings.max_image_size_mb} MB.",
            )

        # Validate it's actually an image
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid image.",
            )

    # Run the NYASA pipeline
    try:
        result = await run_verification(
            claim_text=claim_text,
            image_bytes=image_bytes,
        )
        return result
    except Exception as e:
        print(f"[NYASA] Verification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Verification pipeline encountered an error. Please try again.",
        )
