import os
from dataclasses import dataclass, field
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass


@dataclass
class Settings:
    ollama_base: str = os.getenv("OLLAMA_BASE", "http://localhost:11434")
    model: str = os.getenv("MODEL", "qwen3.5:9b")
    github_token: str = os.getenv("GITHUB_TOKEN", "")
    log_ring_size: int = 200
    cors_origins: list[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:4173",
    ])


settings = Settings()
