import json
import time
import uuid

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..logger import log
from ..services import ollama

router = APIRouter()

_SYSTEM = (
    "You are a concise, professional AI assistant. "
    "Answer clearly and directly. No unnecessary filler."
)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    think: bool = False


@router.post("/chat")
async def chat(req: ChatRequest):
    rid = uuid.uuid4().hex[:8]
    log("chat_start", rid=rid, chars=len(req.message), turns=len(req.history))
    t0 = time.perf_counter()

    # Build flat prompt from conversation history
    prompt = "".join(
        f"{'User' if t['role'] == 'user' else 'Assistant'}: {t['content']}\n"
        for t in req.history
        if t.get("role") in ("user", "assistant")
    )
    prompt += f"User: {req.message}\nAssistant:"

    tokens = 0

    async def generate():
        nonlocal tokens
        try:
            async for token in ollama.stream(prompt, system=_SYSTEM, think=req.think):
                tokens += 1
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as exc:
            log("chat_error", rid=rid, error=str(exc))
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        elapsed = round(time.perf_counter() - t0, 2)
        log("chat_done", rid=rid, tokens=tokens, elapsed_s=elapsed)
        yield f"data: {json.dumps({'done': True, 'tokens': tokens, 'elapsed': elapsed})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
