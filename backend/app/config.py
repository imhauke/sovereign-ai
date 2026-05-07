import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    ollama_base: str = os.getenv("OLLAMA_BASE", "http://localhost:11434")
    model: str = os.getenv("MODEL", "qwen3.5:9b")
    log_ring_size: int = 200
    cors_origins: list[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:4173",
    ])


settings = Settings()
