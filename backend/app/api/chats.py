import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db import get_db

router = APIRouter(prefix="/chats")


# ── Schemas ────────────────────────────────────────────────────────────────────

class CreateChatBody(BaseModel):
    title: str = "New Chat"
    think: bool = False

class UpdateChatBody(BaseModel):
    title: str | None = None
    think: bool | None = None

class SaveMessageBody(BaseModel):
    id: str
    role: str
    content: str
    tokens: int | None = None
    elapsed_s: float | None = None


# ── Chat CRUD ──────────────────────────────────────────────────────────────────

@router.get("")
async def list_chats():
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, title, think, created_at, updated_at FROM chats ORDER BY updated_at DESC"
        )
        return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_chat(body: CreateChatBody):
    chat_id = uuid.uuid4().hex
    async with get_db() as db:
        await db.execute(
            "INSERT INTO chats (id, title, think) VALUES (?, ?, ?)",
            (chat_id, body.title, int(body.think)),
        )
        await db.commit()
        row = await db.execute_fetchall("SELECT * FROM chats WHERE id = ?", (chat_id,))
        return dict(row[0])


@router.patch("/{chat_id}")
async def update_chat(chat_id: str, body: UpdateChatBody):
    async with get_db() as db:
        if body.title is not None:
            await db.execute(
                "UPDATE chats SET title = ?, updated_at = datetime('now') WHERE id = ?",
                (body.title, chat_id),
            )
        if body.think is not None:
            await db.execute(
                "UPDATE chats SET think = ?, updated_at = datetime('now') WHERE id = ?",
                (int(body.think), chat_id),
            )
        await db.commit()
        rows = await db.execute_fetchall("SELECT * FROM chats WHERE id = ?", (chat_id,))
        if not rows:
            raise HTTPException(404, "Chat not found")
        return dict(rows[0])


@router.delete("/{chat_id}", status_code=204)
async def delete_chat(chat_id: str):
    async with get_db() as db:
        await db.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        await db.commit()


# ── Messages ───────────────────────────────────────────────────────────────────

@router.get("/{chat_id}/messages")
async def get_messages(chat_id: str):
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
            (chat_id,),
        )
        return [dict(r) for r in rows]


@router.post("/{chat_id}/messages", status_code=201)
async def save_message(chat_id: str, body: SaveMessageBody):
    async with get_db() as db:
        await db.execute(
            """INSERT INTO messages (id, chat_id, role, content, tokens, elapsed_s)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (body.id, chat_id, body.role, body.content, body.tokens, body.elapsed_s),
        )
        # Bump chat's updated_at so it floats to the top of the sidebar
        await db.execute(
            "UPDATE chats SET updated_at = datetime('now') WHERE id = ?", (chat_id,)
        )
        await db.commit()
    return {"ok": True}
