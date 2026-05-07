import { useEffect } from 'react'
import { fetchHealth } from '../api'
import { useAppStore } from '../store/app'

export function useHealth() {
  const setModel = useAppStore((s) => s.setModel)

  useEffect(() => {
    async function check() {
      try {
        const d = await fetchHealth()
        if (d.status === 'ok') {
          setModel('online', `${d.model} · ollama ${d.ollama_version}`)
        } else {
          setModel('error', d.error ?? 'Ollama error')
        }
      } catch {
        setModel('error', 'Cannot reach backend')
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [setModel])
}
