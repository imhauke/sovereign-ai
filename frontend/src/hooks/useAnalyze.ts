import { useState } from 'react'
import { analyzeDocument } from '../api'
import type { AnalysisResult } from '../types'

const LS_TEXT   = 'sovereign:analyze:text'
const LS_RESULT = 'sovereign:analyze:result'
const LS_ELAPSED = 'sovereign:analyze:elapsed'

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function useAnalyze() {
  const [text,    setText_]   = useState<string>(() => loadLS(LS_TEXT, ''))
  const [result,  setResult_] = useState<AnalysisResult | null>(() => loadLS(LS_RESULT, null))
  const [elapsed, setElapsed_] = useState<number | null>(() => loadLS(LS_ELAPSED, null))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function setText(val: string) {
    setText_(val)
    localStorage.setItem(LS_TEXT, JSON.stringify(val))
  }

  function setResult(val: AnalysisResult | null) {
    setResult_(val)
    localStorage.setItem(LS_RESULT, JSON.stringify(val))
  }

  function setElapsed(val: number | null) {
    setElapsed_(val)
    localStorage.setItem(LS_ELAPSED, JSON.stringify(val))
  }

  const analyze = async (input: string) => {
    setLoading(true)
    setResult(null)
    setElapsed(null)
    setError(null)
    try {
      const res = await analyzeDocument(input)
      if (res.ok) {
        setResult(res.result)
        setElapsed(res.elapsed)
      } else {
        setError(res.error)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return { text, setText, loading, result, elapsed, error, analyze }
}
