from fastapi import APIRouter

from ..logger import get_ring

router = APIRouter()


@router.get("/logs")
async def get_logs(since: int = 0):
    entries = get_ring()
    return {"logs": entries[since:], "total": len(entries)}
