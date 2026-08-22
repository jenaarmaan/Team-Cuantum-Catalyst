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

from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1", tags=["verification"])

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
}

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif"}


@router.post("/verify", response_model=VerificationResponse)
async def verify_content(
    claim: str = Form(..., max_length=10000, description="The claim to verify"),
    image: UploadFile | None = File(None, description="Optional image to analyze"),
):
    """
    Submit content for NYASA verification.
    """

    # Validate claim
    if not claim or not claim.strip():
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "code": "MISSING_CLAIM",
                "message": "A claim is required for verification.",
                "detail": "A claim is required for verification."
            }
        )

    claim_text = claim.strip()

    # Validate and read image if provided
    image_bytes = None
    if image:
        # Check file extension
        filename = image.filename or ""
        ext = filename.split('.')[-1].lower() if '.' in filename else ""
        if not ext or ext not in ALLOWED_EXTENSIONS:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "UNSUPPORTED_IMAGE",
                    "message": f"Unsupported file extension: .{ext}. Supported formats: JPEG, PNG, WebP, GIF, BMP, TIFF.",
                    "detail": f"Unsupported file extension: .{ext}."
                }
            )

        # Check MIME type
        if image.content_type not in ALLOWED_MIME_TYPES:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "UNSUPPORTED_IMAGE",
                    "message": f"Unsupported image format: {image.content_type}. Supported: JPEG, PNG, WebP, GIF, BMP, TIFF.",
                    "detail": f"Unsupported image format: {image.content_type}."
                }
            )

        # Read and validate size
        try:
            image_bytes = await image.read()
            print(f"[INGESTION] filename={image.filename}")
            print(f"[INGESTION] content_type={image.content_type}")
            print(f"[INGESTION] bytes={len(image_bytes)}")
        except Exception:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "CORRUPTED_IMAGE",
                    "message": "The uploaded file could not be read.",
                    "detail": "The uploaded file could not be read."
                }
            )

        if len(image_bytes) > settings.max_image_size_bytes:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "IMAGE_TOO_LARGE",
                    "message": f"Image too large. Maximum size: {settings.max_image_size_mb} MB.",
                    "detail": f"Image too large. Maximum size: {settings.max_image_size_mb} MB."
                }
            )

        # Validate it's actually an image & decodable
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            
            # Re-open for further checks since verify() closes the file pointer
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            if width <= 0 or height <= 0:
                raise ValueError("Invalid image dimensions")
        except Exception as e:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "code": "CORRUPTED_IMAGE",
                    "message": f"The uploaded file could not be decoded as a valid image: {e}.",
                    "detail": "The uploaded file could not be processed as a valid image."
                }
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
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "code": "INTERNAL_ERROR",
                "message": "Verification pipeline encountered an error. Please try again.",
                "detail": "Verification pipeline encountered an error. Please try again."
            }
        )
