export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  meta?: { tokens?: number; elapsed?: number }
  error?: boolean
}

/** Chat metadata — matches the DB row. Messages are loaded separately. */
export interface Chat {
  id: string
  title: string
  think: boolean
  created_at: string
  updated_at: string
}

export interface AnalysisResult {
  document_type: string
  summary: string
  key_points: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  action_items: string[]
  risk_flags: string[]
  compliance_notes: string[]
}

export interface LogEntry {
  ts: string
  level: string
  msg: string
  event?: string
  [key: string]: unknown
}

export interface HealthData {
  status: 'ok' | 'error'
  model?: string
  ollama_version?: string
  error?: string
}
