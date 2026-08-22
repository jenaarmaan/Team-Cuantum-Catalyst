import unittest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
import io
from PIL import Image

# Import sys/os adjustments to load modules correctly
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

class TestIngestion(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_report = {
            "verification_id": "test_id",
            "status": "completed",
            "timestamp": "2026-08-22T12:00:00Z",
            "claim_text": "This is a claim",
            "has_media": False,
            "extracted_claim": {
                "original_text": "This is a claim",
                "normalized_claim": "This is a claim",
                "entities": [],
                "event_type": None,
                "location": None,
                "time_reference": None,
                "key_assertion": "This is a claim",
                "atomic_claims": ["This is a claim"]
            },
            "media_analysis": None,
            "provenance_signals": [],
            "evidence": [],
            "pillars": [],
            "supporting_count": 0,
            "contradicting_count": 0,
            "context_count": 0,
            "unresolved_count": 0,
            "assessment": {
                "label": "insufficient_evidence",
                "display_label": "Insufficient Evidence",
                "confidence": 0.5,
                "confidence_percent": 50,
                "ecs": 50,
                "media_integrity": {"label": "UNCERTAIN", "score": 50, "confidence": 50},
                "context_integrity": {"label": "UNRESOLVED", "score": 50, "confidence": 50}
            },
            "uncertainty": {
                "level": "high",
                "score": 70,
                "factors": [],
                "summary": "High uncertainty",
                "what_would_help": []
            },
            "explanation": "No evidence",
            "key_findings": [],
            "recommended_action": "Be careful",
            "limitations": []
        }

    @patch("app.api.verification.run_verification", new_callable=AsyncMock)
    def test_verify_claim_only(self, mock_run):
        mock_run.return_value = self.mock_report

        response = self.client.post("/api/v1/verify", data={"claim": "This is a claim"}, files={})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["verification_id"], "test_id")
        self.assertFalse(response.json()["has_media"])

    def test_verify_empty_claim(self):
        # Pass space to force serialization of the claim key, which will be caught by claim.strip() validation
        response = self.client.post("/api/v1/verify", data={"claim": " "}, files={"image": (None, b"")})
        if response.status_code != 400:
            print(f"[TEST DIAGNOSTIC] Empty claim response code: {response.status_code}, details: {response.json()}")
        self.assertEqual(response.status_code, 400)
        json_data = response.json()
        self.assertEqual(json_data["status"], "error")
        self.assertEqual(json_data["code"], "MISSING_CLAIM")

    @patch("app.api.verification.run_verification", new_callable=AsyncMock)
    def test_verify_supported_formats(self, mock_run):
        # Return complete mock report structure to satisfy FastAPI validation
        img_report = dict(self.mock_report)
        img_report["has_media"] = True
        img_report["verification_id"] = "img_id"
        mock_run.return_value = img_report
        
        # Test JPEG, PNG, WebP, GIF, BMP, TIFF
        formats = [("JPEG", "image/jpeg", "test.jpg"), 
                   ("PNG", "image/png", "test.png"), 
                   ("WEBP", "image/webp", "test.webp"),
                   ("GIF", "image/gif", "test.gif"),
                   ("BMP", "image/bmp", "test.bmp")]
                   
        for fmt, mime, filename in formats:
            # Create a simple valid image in memory
            f = io.BytesIO()
            img = Image.new("RGB", (100, 100), color="red")
            img.save(f, format=fmt)
            f.seek(0)
            
            response = self.client.post(
                "/api/v1/verify",
                data={"claim": "Claim with image"},
                files={"image": (filename, f, mime)}
            )
            self.assertEqual(response.status_code, 200, f"Failed format: {fmt}")

    def test_verify_unsupported_format(self):
        # Create text file bytes
        f = io.BytesIO(b"Hello world from a text file")
        response = self.client.post(
            "/api/v1/verify",
            data={"claim": "Claim with text file"},
            files={"image": ("document.txt", f, "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        json_data = response.json()
        self.assertEqual(json_data["status"], "error")
        self.assertEqual(json_data["code"], "UNSUPPORTED_IMAGE")

    def test_verify_corrupted_image(self):
        # Upload random un-decodable bytes pretending to be a jpeg
        f = io.BytesIO(b"\x00\x01\x02\x03random_corrupted_bytes\xFF\xD9")
        response = self.client.post(
            "/api/v1/verify",
            data={"claim": "Claim with corrupted image"},
            files={"image": ("corrupted.jpg", f, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 400)
        json_data = response.json()
        self.assertEqual(json_data["status"], "error")
        self.assertEqual(json_data["code"], "CORRUPTED_IMAGE")

    def test_verify_oversized_image(self):
        # Pad file to 25MB (settings.max_image_size_mb is 20)
        f = io.BytesIO()
        img = Image.new("RGB", (10, 10), color="blue")
        img.save(f, format="JPEG")
        f.write(b"0" * 25 * 1024 * 1024)
        f.seek(0)
        
        response = self.client.post(
            "/api/v1/verify",
            data={"claim": "Claim with oversized image"},
            files={"image": ("large.jpg", f, "image/jpeg")}
        )
        self.assertEqual(response.status_code, 400)
        json_data = response.json()
        self.assertEqual(json_data["status"], "error")
        self.assertEqual(json_data["code"], "IMAGE_TOO_LARGE")

if __name__ == "__main__":
    unittest.main()
