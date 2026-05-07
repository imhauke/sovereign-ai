import { useEffect, useRef, useState } from 'react'
import { fetchLogs } from '../api'
import type { LogEntry } from '../types'

export function useLogs() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const offsetRef = useRef(0)

  useEffect(() => {
    async function poll() {
      try {
        const d = await fetchLogs(offsetRef.current)
        if (d.logs.length > 0) {
          offsetRef.current += d.logs.length
          setEntries((prev) => [...prev, ...(d.logs as LogEntry[])])
        }
      } catch {
        /* server may not be ready yet */
      }
    }

    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [])

  const clear = () => {
    setEntries([])
    offsetRef.current = 0
  }

  return { entries, clear }
}
