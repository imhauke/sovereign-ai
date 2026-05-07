import { useState } from 'react'
import { analyzeDocument } from '../api'
import type { AnalysisResult } from '../types'

interface AnalyzeState {
  loading: boolean
  result: AnalysisResult | null
  elapsed: number | null
  error: string | null
}

export function useAnalyze() {
  const [state, setState] = useState<AnalyzeState>({
    loading: false,
    result: null,
    elapsed: null,
    error: null,
  })

  const analyze = async (text: string) => {
    setState({ loading: true, result: null, elapsed: null, error: null })
    try {
      const res = await analyzeDocument(text)
      if (res.ok) {
        setState({ loading: false, result: res.result, elapsed: res.elapsed, error: null })
      } else {
        setState({ loading: false, result: null, elapsed: null, error: res.error })
      }
    } catch (err) {
      setState({ loading: false, result: null, elapsed: null, error: String(err) })
    }
  }

  return { ...state, analyze }
}
