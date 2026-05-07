import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any

from .config import settings

_ring: deque[dict[str, Any]] = deque(maxlen=settings.log_ring_size)


class _RingHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        _ring.append({
            "ts": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "msg": record.getMessage(),
            **getattr(record, "ctx", {}),
        })


def _setup() -> logging.Logger:
    fmt = logging.Formatter("%(asctime)s [%(levelname)-8s] %(name)s | %(message)s")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    for h in [logging.StreamHandler(), logging.FileHandler("sovereign.log"), _RingHandler()]:
        if not isinstance(h, _RingHandler):
            h.setFormatter(fmt)
        root.addHandler(h)
    return logging.getLogger("sovereign")


logger = _setup()


def get_ring() -> list[dict[str, Any]]:
    return list(_ring)


def log(event: str, **ctx: Any) -> None:
    record = logger.makeRecord(
        "sovereign", logging.INFO, "", 0,
        f"[{event}] " + "  ".join(f"{k}={v}" for k, v in ctx.items()),
        (), None,
    )
    record.ctx = {"event": event, **ctx}  # type: ignore[attr-defined]
    logger.handle(record)
