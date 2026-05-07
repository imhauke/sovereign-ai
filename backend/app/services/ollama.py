"""Async Ollama client. Thinking mode disabled for speed; re-enable per-call if needed."""

import json
from typing import AsyncGenerator

import httpx

from ..config import settings


async def stream(prompt: str, system: str | None = None, think: bool = False) -> AsyncGenerator[str, None]:
    payload: dict = {"model": settings.model, "prompt": prompt, "stream": True, "think": think}
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=180) as client:
        async with client.stream("POST", f"{settings.ollama_base}/api/generate", json=payload) as r:
            r.raise_for_status()
            async for line in r.aiter_lines():
                if not line:
                    continue
                data = json.loads(line)
                if data.get("done"):
                    break
                token = data.get("response", "")
                if token:
                    yield token


async def complete(prompt: str, system: str | None = None, think: bool = False) -> str:
    payload: dict = {"model": settings.model, "prompt": prompt, "stream": False, "think": think}
    if system:
        payload["system"] = system
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(f"{settings.ollama_base}/api/generate", json=payload)
        r.raise_for_status()
        return r.json()["response"].strip()
