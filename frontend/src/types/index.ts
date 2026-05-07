export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  meta?: { tokens?: number; elapsed?: number }
  error?: boolean
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  think: boolean
  createdAt: Date
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
