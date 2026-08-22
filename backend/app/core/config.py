"""
NYASA Core Configuration
Loads environment variables and provides typed settings.
"""

from pydantic_settings import BaseSettings
from typing import List


import os

_current_dir = os.path.dirname(os.path.abspath(__file__))
_env_file_path = os.path.abspath(os.path.join(_current_dir, "..", "..", ".env"))

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    gemini_api_key: str = ""
    tavily_api_key: str = ""

    # Model Configuration
    gemini_model: str = "gemini-2.5-flash"

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # File Upload Limits
    max_image_size_mb: int = 15
    max_claim_length: int = 10000

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_image_size_bytes(self) -> int:
        return self.max_image_size_mb * 1024 * 1024

    class Config:
        env_file = _env_file_path
        env_file_encoding = "utf-8"


settings = Settings()
