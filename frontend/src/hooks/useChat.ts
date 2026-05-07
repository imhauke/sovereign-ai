import { useCallback, useState } from 'react'
import { streamChat } from '../api'
import { uid } from '../lib/utils'
import { useAppStore } from '../store/app'

export function useChat() {
  const {
    chats, activeChatId,
    appendMessage, appendToken, patchMessage,
    setThink, setChatTitle,
  } = useAppStore()

  const [streaming, setStreaming] = useState(false)

  const activeChat = chats.find((c) => c.id === activeChatId)!

  const send = useCallback(
    async (content: string) => {
      if (streaming || !content.trim()) return
      setStreaming(true)

      // Auto-title from first user message
      if (activeChat.messages.length === 0) {
        setChatTitle(activeChatId, content.slice(0, 45) + (content.length > 45 ? '…' : ''))
      }

      const userMsg = { id: uid(), role: 'user' as const, content, timestamp: new Date() }
      appendMessage(activeChatId, userMsg)

      const assistantId = uid()
      appendMessage(activeChatId, { id: assistantId, role: 'assistant', content: '', timestamp: new Date() })

      // Snapshot history before streaming starts
      const history = activeChat.messages.map((m) => ({ role: m.role, content: m.content }))

      try {
        for await (const event of streamChat(content, history, activeChat.think)) {
          if (event.token) appendToken(activeChatId, assistantId, event.token)
          if (event.done) patchMessage(activeChatId, assistantId, { meta: { tokens: event.tokens, elapsed: event.elapsed } })
          if (event.error) patchMessage(activeChatId, assistantId, { content: `Error: ${event.error}`, error: true })
        }
      } catch (err) {
        patchMessage(activeChatId, assistantId, { content: `Network error: ${err}`, error: true })
      } finally {
        setStreaming(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [streaming, activeChatId, activeChat],
  )

  return {
    messages: activeChat.messages,
    send,
    streaming,
    think: activeChat.think,
    toggleThink: () => setThink(activeChatId, !activeChat.think),
  }
}
