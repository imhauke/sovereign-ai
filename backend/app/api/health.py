import httpx
from fastapi import APIRouter

from ..config import settings
from ..logger import log

router = APIRouter()


@router.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_base}/api/version")
            version = r.json().get("version", "?")
        log("health_check", status="ok", model=settings.model, ollama=version)
        return {"status": "ok", "model": settings.model, "ollama_version": version}
    except Exception as exc:
        log("health_check", status="error", error=str(exc))
        return {"status": "error", "error": str(exc)}
