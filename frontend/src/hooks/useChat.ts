import { useCallback, useState } from 'react'
import { apiSaveMessage, streamChat } from '../api'
import { uid } from '../lib/utils'
import { useAppStore } from '../store/app'
import type { Message } from '../types'

export function useChat() {
  const {
    chats, activeChatId, messageCache,
    appendMessage, appendToken, patchMessage,
    renameChat,
  } = useAppStore()

  const [streaming, setStreaming] = useState(false)

  const activeChat = chats.find((c) => c.id === activeChatId)
  const messages: Message[] = activeChatId ? (messageCache[activeChatId] ?? []) : []

  const send = useCallback(
    async (content: string) => {
      if (streaming || !content.trim() || !activeChatId || !activeChat) return
      setStreaming(true)

      // Auto-title on first message
      if (messages.length === 0) {
        renameChat(activeChatId, content.slice(0, 45) + (content.length > 45 ? '…' : ''))
      }

      const userMsg: Message = { id: uid(), role: 'user', content, timestamp: new Date() }
      const assistantId = uid()
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }

      appendMessage(activeChatId, userMsg)
      appendMessage(activeChatId, assistantMsg)

      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      let finalAssistant = assistantMsg

      try {
        for await (const event of streamChat(content, history, activeChat.think)) {
          if (event.token) appendToken(activeChatId, assistantId, event.token)
          if (event.done) {
            const meta = { tokens: event.tokens, elapsed: event.elapsed }
            patchMessage(activeChatId, assistantId, { meta })
            finalAssistant = { ...finalAssistant, meta }
          }
          if (event.error) {
            patchMessage(activeChatId, assistantId, { content: `Error: ${event.error}`, error: true })
            finalAssistant = { ...finalAssistant, content: `Error: ${event.error}`, error: true }
          }
        }
      } catch (err) {
        patchMessage(activeChatId, assistantId, { content: `Network error: ${err}`, error: true })
        finalAssistant = { ...finalAssistant, content: `Network error: ${err}`, error: true }
      } finally {
        setStreaming(false)
      }

      // Persist both turns to the DB — same as OpenAI/Anthropic save after response completes
      const chatId = activeChatId
      await apiSaveMessage(chatId, userMsg)
      // Read final assistant content from cache
      const cachedContent = useAppStore.getState().messageCache[chatId]?.find((m) => m.id === assistantId)?.content ?? finalAssistant.content
      await apiSaveMessage(chatId, { ...finalAssistant, content: cachedContent })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [streaming, activeChatId, activeChat, messages],
  )

  return {
    messages,
    send,
    streaming,
    think: activeChat?.think ?? false,
    toggleThink: () => activeChatId && useAppStore.getState().toggleThink(activeChatId),
  }
}
