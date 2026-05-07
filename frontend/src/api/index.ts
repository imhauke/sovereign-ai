import type { AnalysisResult, Chat, HealthData, Message } from '../types'

// ── Health ─────────────────────────────────────────────────────────────────────
export async function fetchHealth(): Promise<HealthData> {
  const r = await fetch('/api/health')
  return r.json()
}

// ── Logs ───────────────────────────────────────────────────────────────────────
export async function fetchLogs(since: number) {
  const r = await fetch(`/api/logs?since=${since}`)
  return r.json() as Promise<{ logs: unknown[]; total: number }>
}

// ── Chats CRUD ─────────────────────────────────────────────────────────────────
export async function apiListChats(): Promise<Chat[]> {
  const r = await fetch('/api/chats')
  const rows: Array<Record<string, unknown>> = await r.json()
  return rows.map((c) => ({ ...c, think: Boolean(c.think) }) as Chat)
}

export async function apiCreateChat(title = 'New Chat', think = false): Promise<Chat> {
  const r = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, think }),
  })
  const c = await r.json()
  return { ...c, think: Boolean(c.think) }
}

export async function apiUpdateChat(id: string, patch: { title?: string; think?: boolean }): Promise<Chat> {
  const r = await fetch(`/api/chats/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const c = await r.json()
  return { ...c, think: Boolean(c.think) }
}

export async function apiDeleteChat(id: string): Promise<void> {
  await fetch(`/api/chats/${id}`, { method: 'DELETE' })
}

// ── Messages ───────────────────────────────────────────────────────────────────
export async function apiGetMessages(chatId: string): Promise<Message[]> {
  const r = await fetch(`/api/chats/${chatId}/messages`)
  const rows: Array<Record<string, unknown>> = await r.json()
  return rows.map((m) => ({
    id: m.id as string,
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
    timestamp: new Date(m.created_at as string),
    meta: m.tokens != null ? { tokens: m.tokens as number, elapsed: m.elapsed_s as number } : undefined,
  }))
}

export async function apiSaveMessage(chatId: string, msg: Message): Promise<void> {
  await fetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      tokens: msg.meta?.tokens,
      elapsed_s: msg.meta?.elapsed,
    }),
  })
}

// ── Chat streaming ─────────────────────────────────────────────────────────────
export interface ChatEvent {
  token?: string
  done?: boolean
  tokens?: number
  elapsed?: number
  error?: string
}

export async function* streamChat(
  message: string,
  history: Array<{ role: string; content: string }>,
  think = false,
): AsyncGenerator<ChatEvent> {
  const r = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, think }),
  })

  const reader = r.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) yield JSON.parse(line.slice(6)) as ChatEvent
    }
  }
}

// ── Document analysis ──────────────────────────────────────────────────────────
export async function analyzeDocument(
  text: string,
): Promise<{ ok: true; result: AnalysisResult; elapsed: number } | { ok: false; error: string }> {
  const r = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return r.json()
}
