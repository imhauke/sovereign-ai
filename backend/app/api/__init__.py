from fastapi import APIRouter

from .chat import router as chat_router
from .analyze import router as analyze_router
from .health import router as health_router
from .logs import router as logs_router
from .chats import router as chats_router
from .agent import router as agent_router

router = APIRouter(prefix="/api")
router.include_router(health_router)
router.include_router(chats_router)
router.include_router(agent_router)
router.include_router(chat_router)
router.include_router(analyze_router)
router.include_router(logs_router)
