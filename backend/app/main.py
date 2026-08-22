"""
NYASA — Evidence-Based Media & Claim Verification Intelligence
FastAPI Application Entry Point

NYASA doesn't tell you what to believe.
It shows you why something may or may not deserve your trust.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.api.verification import router as verification_router

app = FastAPI(
    title="NYASA",
    description=(
        "Evidence-Based Multimodal Media & Claim Verification Intelligence. "
        "NYASA combines multimodal AI analysis, source signals, contextual evidence, "
        "and explicit uncertainty to help users evaluate suspicious content. "
        "It never returns TRUE/FALSE — every assessment includes evidence, confidence, and uncertainty."
    ),
    version="0.1.0",
)

# CORS for frontend (useful in development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(verification_router)


@app.get("/health", tags=["health"])
async def health():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.gemini_api_key),
        "tavily_configured": bool(settings.tavily_api_key),
    }


# ─── Serve Frontend Static Files (For Single Platform Deployment) ───

frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))

if os.path.exists(frontend_dist_path):
    # Mount assets folder
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    # Serve index.html for all non-API routes (SPA Routing)
    @app.get("/{fallback_path:path}", tags=["frontend"])
    async def fallback(fallback_path: str):
        if fallback_path.startswith("api/v1") or fallback_path.startswith("health"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        index_path = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(
            status_code=404,
            detail="Frontend build found but index.html is missing. Run npm run build."
        )
else:
    # If no build is present, provide a helpful default root message
    @app.get("/", tags=["health"])
    async def root():
        return {
            "name": "NYASA API Service",
            "tagline": "Evidence-Based Verification Intelligence",
            "version": "0.1.0",
            "status": "operational",
            "frontend_note": "Frontend static assets not built. Run npm run build inside the frontend folder to serve it from this backend service."
        }
