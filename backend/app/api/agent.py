"""
Agentic endpoints. The model has one tool — http_get — and decides
autonomously which URLs to call, what data to extract, and how to format it.
"""

import json

import httpx
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from ..config import settings
from ..db import get_db
from ..logger import log

router = APIRouter(prefix="/agent")

# ── Tool ───────────────────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "http_get",
            "description": "Make an HTTP GET request to a URL and return the response body.",
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"],
            },
        },
    },
]

async def _http_get(url: str) -> str:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, headers={"User-Agent": "sovereign-ai/1.0"})
        r.raise_for_status()
        return r.text

_SYSTEM = """\
You are an AI assistant with internet access via the http_get tool.
The repository you manage is: imhauke/sovereign-ai
Never invent data — always fetch it first.\
"""

# ── Core agentic loop ──────────────────────────────────────────────────────────

async def _agent_loop(messages: list[dict], stop_after_fetch: bool = False) -> tuple[str, list[str]]:
    """
    Run the agentic loop.
    stop_after_fetch=True: return immediately after executing tool calls,
    skipping the second LLM call. Used by structured endpoints that parse
    the raw HTTP response themselves — eliminates the slow second inference.
    """
    tool_responses: list[str] = []

    for iteration in range(6):
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(
                f"{settings.ollama_base}/api/chat",
                json={"model": settings.model, "messages": messages,
                      "tools": TOOLS, "stream": False, "think": False},
            )
            r.raise_for_status()

        msg = r.json()["message"]
        messages.append(msg)

        tool_calls = msg.get("tool_calls") or []
        if not tool_calls:
            log("agent_done", iterations=iteration + 1)
            return msg.get("content", ""), tool_responses

        for tc in tool_calls:
            fn = tc["function"]
            raw_args = fn.get("arguments", {})
            args = raw_args if isinstance(raw_args, dict) else json.loads(raw_args)
            url = args.get("url", "")
            log("agent_http_get", url=url)
            try:
                result = await _http_get(url)
            except Exception as e:
                result = json.dumps({"error": str(e)})
            tool_responses.append(result)
            messages.append({"role": "tool", "content": result})

        if stop_after_fetch:
            log("agent_done", iterations=iteration + 1, mode="stop_after_fetch")
            return "", tool_responses

    return "", tool_responses


# ── Structured data endpoints (for the tree UI) ────────────────────────────────

def _parse_github_commits(raw_list: list) -> list[dict]:
    return [
        {
            "sha": c["sha"][:7],
            "sha_full": c["sha"],
            "message": c["commit"]["message"].split("\n")[0],
            "author": c["commit"]["author"]["name"],
            "date": c["commit"]["author"]["date"],
            "url": c["html_url"],
        }
        for c in raw_list
    ]


def _parse_github_detail(d: dict) -> dict:
    lines = d["commit"]["message"].split("\n")
    return {
        "sha": d["sha"][:7],
        "sha_full": d["sha"],
        "message": lines[0],
        "body": "\n".join(lines[2:]).strip(),
        "author": d["commit"]["author"]["name"],
        "date": d["commit"]["author"]["date"],
        "url": d["html_url"],
        "stats": d.get("stats", {}),
        "files": [
            {"filename": f["filename"], "status": f["status"],
             "additions": f["additions"], "deletions": f["deletions"], "patch": f.get("patch")}
            for f in d.get("files", [])[:20]
        ],
    }


async def _fetch_and_store_commits(limit: int) -> list[dict]:
    """Ask the AI which URL to call, fetch from GitHub, persist new commits."""
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": f"Fetch the last {limit} commits."},
    ]
    _, tool_responses = await _agent_loop(messages, stop_after_fetch=True)
    if not tool_responses:
        return []
    try:
        raw = json.loads(tool_responses[-1])
        commits = _parse_github_commits(raw if isinstance(raw, list) else [])
    except Exception as e:
        log("agent_parse_error", error=str(e))
        return []
    async with get_db() as db:
        await db.executemany(
            "INSERT OR IGNORE INTO commits (sha_full, sha, message, author, date, url) VALUES (?,?,?,?,?,?)",
            [(c["sha_full"], c["sha"], c["message"], c["author"], c["date"], c["url"]) for c in commits],
        )
        await db.commit()
    log("commits_stored", count=len(commits))
    return commits


async def _fetch_and_store_detail(sha: str) -> dict:
    """Ask the AI which URL to call, fetch commit detail from GitHub, persist it."""
    messages = [
        {"role": "system", "content": _SYSTEM},
        {"role": "user", "content": f"Fetch full details for commit {sha}."},
    ]
    _, tool_responses = await _agent_loop(messages, stop_after_fetch=True)
    if not tool_responses:
        return {}
    try:
        detail = _parse_github_detail(json.loads(tool_responses[-1]))
    except Exception as e:
        log("agent_parse_error", sha=sha, error=str(e))
        return {}
    stats = detail.get("stats", {})
    async with get_db() as db:
        await db.execute(
            "INSERT OR IGNORE INTO commits (sha_full, sha, message, author, date, url) VALUES (?,?,?,?,?,?)",
            (detail["sha_full"], detail["sha"], detail["message"], detail["author"], detail["date"], detail["url"]),
        )
        await db.execute(
            """INSERT OR REPLACE INTO commit_details
               (sha_full, body, stats_additions, stats_deletions, stats_total, files_json)
               VALUES (?,?,?,?,?,?)""",
            (detail["sha_full"], detail.get("body", ""),
             stats.get("additions", 0), stats.get("deletions", 0), stats.get("total", 0),
             json.dumps(detail.get("files", []))),
        )
        await db.commit()
    log("commit_detail_stored", sha=sha)
    return detail


@router.get("/commits")
async def get_commits_structured(
    background_tasks: BackgroundTasks,
    limit: int = 20,
    refresh: bool = False,
):
    # refresh=True → skip cache, fetch GitHub synchronously and wait
    if refresh:
        log("commits_force_refresh")
        commits = await _fetch_and_store_commits(limit)
        return {"commits": commits, "source": "github"}

    # Return DB immediately → schedule background fetch to pick up new commits
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT sha, sha_full, message, author, date, url FROM commits ORDER BY date DESC LIMIT ?",
            (limit,),
        )

    if rows:
        log("commits_cache_hit", count=len(rows))
        # Fire-and-forget: fetches GitHub in background, stores any new commits
        background_tasks.add_task(_fetch_and_store_commits, limit)
        return {"commits": [dict(r) for r in rows], "source": "cache"}

    # DB empty → must wait for first GitHub fetch
    log("commits_cold_start")
    commits = await _fetch_and_store_commits(limit)
    return {"commits": commits, "source": "github"}


@router.get("/commit/{sha}")
async def get_commit_detail(
    sha: str,
    background_tasks: BackgroundTasks,
    refresh: bool = False,
):
    # refresh=True → fetch GitHub synchronously
    if refresh:
        log("commit_detail_force_refresh", sha=sha)
        detail = await _fetch_and_store_detail(sha)
        return {**detail, "source": "github"}

    # Return DB immediately if detail cached
    async with get_db() as db:
        rows = await db.execute_fetchall(
            """SELECT c.sha, c.sha_full, c.message, c.author, c.date, c.url,
                      d.body, d.stats_additions, d.stats_deletions, d.stats_total, d.files_json
               FROM commits c JOIN commit_details d ON c.sha_full = d.sha_full
               WHERE c.sha_full = ? OR c.sha = ?""",
            (sha, sha),
        )
    if rows:
        r = dict(rows[0])
        log("commit_detail_cache_hit", sha=sha)
        # Background refresh to keep detail up to date
        background_tasks.add_task(_fetch_and_store_detail, r["sha_full"])
        return {
            "sha": r["sha"], "sha_full": r["sha_full"],
            "message": r["message"], "body": r["body"],
            "author": r["author"], "date": r["date"], "url": r["url"],
            "stats": {"additions": r["stats_additions"], "deletions": r["stats_deletions"], "total": r["stats_total"]},
            "files": json.loads(r["files_json"]),
            "source": "cache",
        }

    # Not cached → wait for GitHub
    log("commit_detail_cold_start", sha=sha)
    detail = await _fetch_and_store_detail(sha)
    return {**detail, "source": "github"}


# ── Freeform chat endpoint ─────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    messages: list[dict]


@router.post("/chat")
async def agent_chat(req: AgentRequest):
    messages = [{"role": "system", "content": _SYSTEM}] + req.messages
    content, _ = await _agent_loop(messages)
    return {"content": content}
