import type { AnalysisResult, HealthData } from '../types'

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

// ── Analyze ────────────────────────────────────────────────────────────────────
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
  think: boolean = false,
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
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6)) as ChatEvent
      }
    }
  }
}
