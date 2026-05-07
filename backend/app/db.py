"""
SQLite persistence layer.
Schema mirrors how OpenAI/Anthropic store conversations:
  chats    → one row per conversation (id, title, settings, timestamps)
  messages → one row per turn (id, chat_id, role, content, metadata)
"""

from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import aiosqlite

DB_PATH = Path(__file__).parent.parent / "sovereign.db"


@asynccontextmanager
async def get_db() -> AsyncGenerator[aiosqlite.Connection, None]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        await db.execute("PRAGMA journal_mode=WAL")   # concurrent reads
        await db.execute("PRAGMA foreign_keys=ON")
        yield db


async def init_db() -> None:
    async with get_db() as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS chats (
                id         TEXT PRIMARY KEY,
                title      TEXT NOT NULL DEFAULT 'New Chat',
                think      INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS messages (
                id         TEXT PRIMARY KEY,
                chat_id    TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                role       TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content    TEXT NOT NULL,
                tokens     INTEGER,
                elapsed_s  REAL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

            CREATE TABLE IF NOT EXISTS commits (
                sha_full   TEXT PRIMARY KEY,
                sha        TEXT NOT NULL,
                message    TEXT NOT NULL,
                author     TEXT NOT NULL,
                date       TEXT NOT NULL,
                url        TEXT NOT NULL,
                cached_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS commit_details (
                sha_full         TEXT PRIMARY KEY REFERENCES commits(sha_full) ON DELETE CASCADE,
                body             TEXT NOT NULL DEFAULT '',
                stats_additions  INTEGER NOT NULL DEFAULT 0,
                stats_deletions  INTEGER NOT NULL DEFAULT 0,
                stats_total      INTEGER NOT NULL DEFAULT 0,
                files_json       TEXT NOT NULL DEFAULT '[]',
                cached_at        TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
