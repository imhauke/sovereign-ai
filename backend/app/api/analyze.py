import json
import time
import uuid

from fastapi import APIRouter
from pydantic import BaseModel

from ..logger import log
from ..services import ollama

router = APIRouter()

_SYSTEM = """\
You are a document intelligence engine for regulated industries.
Analyze the document and respond ONLY with a valid JSON object — no markdown, no extra text:
{
  "document_type": "e.g. Contract, Email, Clinical Note, Financial Report, Meeting Minutes",
  "summary": "2-3 sentence summary of the document",
  "key_points": ["point 1", "point 2", "point 3"],
  "sentiment": "positive | neutral | negative | mixed",
  "action_items": ["action 1"],
  "risk_flags": ["risk or liability 1"],
  "compliance_notes": ["regulatory or compliance observation"]
}
Use empty arrays when nothing applies. JSON only, no markdown fences.\
"""


class AnalyzeRequest(BaseModel):
    text: str


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    if not req.text.strip():
        return {"ok": False, "error": "No text provided"}

    rid = uuid.uuid4().hex[:8]
    log("analyze_start", rid=rid, chars=len(req.text))
    t0 = time.perf_counter()
    raw = ""

    try:
        raw = await ollama.complete(f"Analyze this document:\n\n{req.text}", system=_SYSTEM, think=False)
        start, end = raw.find("{"), raw.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON object found in model response")
        result = json.loads(raw[start:end])
        elapsed = round(time.perf_counter() - t0, 2)
        log(
            "analyze_done",
            rid=rid,
            doc_type=result.get("document_type", "?"),
            risks=len(result.get("risk_flags", [])),
            elapsed_s=elapsed,
        )
        return {"ok": True, "result": result, "elapsed": elapsed}
    except Exception as exc:
        elapsed = round(time.perf_counter() - t0, 2)
        log("analyze_error", rid=rid, error=str(exc), elapsed_s=elapsed)
        return {"ok": False, "error": str(exc), "raw": raw}
