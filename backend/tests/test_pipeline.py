import unittest
from unittest.mock import patch, AsyncMock
import io
from PIL import Image

# Import sys/os adjustments to load modules correctly
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pipeline import run_verification
from app.models.schemas import EvidenceItem, EvidenceStance, SourceType, MediaAnalysisResult, MediaAuthenticity, ContextConsistency, MediaSignal, MediaQuality

class TestPipeline(unittest.TestCase):
    def setUp(self):
        # Create a small valid JPEG in memory for testing
        self.image_f = io.BytesIO()
        img = Image.new("RGB", (100, 100), color="blue")
        img.save(self.image_f, format="JPEG")
        self.image_bytes = self.image_f.getvalue()

    @patch("app.services.pipeline.retrieve_evidence", new_callable=AsyncMock)
    @patch("app.services.pipeline._run_unified_gemini_analysis", new_callable=AsyncMock)
    def test_full_pipeline_authentic_supported(self, mock_gemini, mock_tavily):
        # Mock search results: 2 supporting news items
        mock_tavily.return_value = [
            EvidenceItem(
                evidence_id="ev_1",
                title="Major news reports event",
                snippet="The event did happen as claimed.",
                source_name="CNN",
                source_type=SourceType.NEWS_MAJOR,
                source_url="https://cnn.com/news",
                published_date="2026-08-22",
                retrieved_at="2026-08-22T12:00:00Z",
                stance=EvidenceStance.UNRESOLVED,
                relevance_score=0.9,
                authority_score=0.8,
                stance_reasoning=""
            )
        ]

        # Mock Gemini response
        mock_gemini.return_value = {
            "extracted_claim": {
                "normalized_claim": "The event happened",
                "entities": ["CNN"],
                "event_type": "News",
                "location": "New York",
                "time_reference": "Today",
                "key_assertion": "The event happened",
                "atomic_claims": ["The event happened"]
            },
            "media_analysis": {
                "media_authenticity": {
                    "assessment": "likely_authentic",
                    "signals": [],
                    "description": "Authentic image"
                },
                "context_consistency": {
                    "assessment": "consistent",
                    "signals": [],
                    "description": "Context is consistent"
                },
                "visual_description": "A blue square",
                "ocr_text": None,
                "media_quality": "high"
            },
            "evidence_stances": [
                {
                    "evidence_id": "ev_1",
                    "stance": "supports",
                    "reasoning": "Directly supports claim"
                }
            ],
            "explanation": "The image is authentic and the web evidence supports the claim.",
            "key_findings": ["Valid source", "Authentic media"],
            "recommended_action": "Safe to share.",
            "limitations": []
        }

        # Run verification (async)
        # Note: since unittest test cases are run synchronously by default, we can run them with asyncio
        import asyncio
        res = asyncio.run(run_verification("The event happened", self.image_bytes))

        # Asserts
        self.assertEqual(res.status, "completed")
        self.assertTrue(res.has_media)
        self.assertEqual(res.assessment.label.value, "likely_authentic_and_supported")
        self.assertEqual(res.media_integrity["label"], "LIKELY_AUTHENTIC")
        self.assertEqual(res.context_integrity["label"], "SUPPORTED")
        
        # Test P1-P6 structures
        self.assertEqual(len(res.pillars), 6)
        p1 = next(p for p in res.pillars if p.pillar_id == "P1")
        self.assertEqual(p1.status, "UNAVAILABLE")  # EXIF not present in memory image
        
        p3 = next(p for p in res.pillars if p.pillar_id == "P3")
        self.assertEqual(p3.status, "AUTHENTIC")
        
        p6 = next(p for p in res.pillars if p.pillar_id == "P6")
        self.assertEqual(p6.status, "SUPPORTED")

    @patch("app.services.pipeline.retrieve_evidence", new_callable=AsyncMock)
    @patch("app.services.pipeline._run_unified_gemini_analysis", new_callable=AsyncMock)
    def test_full_pipeline_misleading_context(self, mock_gemini, mock_tavily):
        mock_tavily.return_value = []
        
        # Mock Gemini flagging inconsistent context (e.g. image does not match the claim details)
        mock_gemini.return_value = {
            "extracted_claim": {
                "normalized_claim": "Flood in New York",
                "entities": [],
                "event_type": None,
                "location": "New York",
                "time_reference": "Today",
                "key_assertion": "Flood",
                "atomic_claims": ["Flood in New York"]
            },
            "media_analysis": {
                "media_authenticity": {
                    "assessment": "likely_authentic",
                    "signals": [],
                    "description": "Authentic image"
                },
                "context_consistency": {
                    "assessment": "inconsistent",
                    "signals": [],
                    "description": "Visual depicts a desert, contradicting New York flood context"
                },
                "visual_description": "A dry desert",
                "ocr_text": None,
                "media_quality": "high"
            },
            "evidence_stances": [],
            "explanation": "The image is authentic but depicts a desert, contradicting a flood claim.",
            "key_findings": ["Context mismatch"],
            "recommended_action": "Do not share as New York flood evidence.",
            "limitations": []
        }

        import asyncio
        res = asyncio.run(run_verification("Flood in New York", self.image_bytes))

        self.assertEqual(res.assessment.label.value, "likely_authentic_but_misleading_context")
        self.assertEqual(res.media_integrity["label"], "LIKELY_AUTHENTIC")
        self.assertEqual(res.context_integrity["label"], "MISLEADING_CONTEXT")

    @patch("app.services.pipeline.retrieve_evidence", new_callable=AsyncMock)
    @patch("app.services.pipeline._run_unified_gemini_analysis", new_callable=AsyncMock)
    def test_pipeline_api_failure_handling(self, mock_gemini, mock_tavily):
        # Tavily returns search results, but Gemini fails (throws exception)
        mock_tavily.return_value = []
        mock_gemini.side_effect = Exception("API connection timed out")

        import asyncio
        res = asyncio.run(run_verification("Claim with failed APIs", self.image_bytes))

        # Check that it falls back gracefully without crashing
        self.assertEqual(res.status, "completed")
        self.assertEqual(res.assessment.label.value, "insufficient_evidence")
        self.assertIn("timed out", res.explanation)
        self.assertTrue(len(res.limitations) > 0)

if __name__ == "__main__":
    unittest.main()
