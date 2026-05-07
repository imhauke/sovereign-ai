import { create } from 'zustand'
import {
  apiCreateChat, apiDeleteChat, apiGetMessages,
  apiListChats, apiUpdateChat,
} from '../api'
import type { Chat, Message } from '../types'

type Tab = 'chat' | 'analyze' | 'commits'
type ModelStatus = 'loading' | 'online' | 'error'

interface AppState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  modelStatus: ModelStatus
  modelLabel: string
  setModel: (status: ModelStatus, label: string) => void

  // Chat list — source of truth is the server
  chats: Chat[]
  activeChatId: string | null

  // Messages cache — keyed by chatId, loaded on demand from server
  messageCache: Record<string, Message[]>

  // Server actions
  loadChats: () => Promise<void>
  createChat: () => Promise<void>
  setActiveChatId: (id: string) => Promise<void>
  renameChat: (id: string, title: string) => Promise<void>
  deleteChat: (id: string) => Promise<void>
  toggleThink: (id: string) => Promise<void>

  // Optimistic message mutations (for streaming)
  appendMessage: (chatId: string, msg: Message) => void
  appendToken: (chatId: string, msgId: string, token: string) => void
  patchMessage: (chatId: string, msgId: string, patch: Partial<Message>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
  modelStatus: 'loading',
  modelLabel: 'Connecting…',
  setModel: (modelStatus, modelLabel) => set({ modelStatus, modelLabel }),

  chats: [],
  activeChatId: null,
  messageCache: {},

  loadChats: async () => {
    const chats = await apiListChats()
    const { activeChatId } = get()
    const nextActive = activeChatId ?? chats[0]?.id ?? null
    set({ chats, activeChatId: nextActive })
    // Load messages for the active chat
    if (nextActive && !get().messageCache[nextActive]) {
      const messages = await apiGetMessages(nextActive)
      set((s) => ({ messageCache: { ...s.messageCache, [nextActive]: messages } }))
    }
  },

  createChat: async () => {
    const chat = await apiCreateChat()
    set((s) => ({
      chats: [chat, ...s.chats],
      activeChatId: chat.id,
      messageCache: { ...s.messageCache, [chat.id]: [] },
    }))
  },

  setActiveChatId: async (id) => {
    set({ activeChatId: id })
    if (!get().messageCache[id]) {
      const messages = await apiGetMessages(id)
      set((s) => ({ messageCache: { ...s.messageCache, [id]: messages } }))
    }
  },

  renameChat: async (id, title) => {
    const updated = await apiUpdateChat(id, { title })
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? updated : c)) }))
  },

  deleteChat: async (id) => {
    await apiDeleteChat(id)
    const remaining = get().chats.filter((c) => c.id !== id)
    let nextId = get().activeChatId
    if (nextId === id) nextId = remaining[0]?.id ?? null

    const cache = { ...get().messageCache }
    delete cache[id]

    if (remaining.length === 0) {
      // Always keep at least one chat
      const fresh = await apiCreateChat()
      set({ chats: [fresh], activeChatId: fresh.id, messageCache: { [fresh.id]: [] } })
    } else {
      set({ chats: remaining, activeChatId: nextId, messageCache: cache })
    }
  },

  toggleThink: async (id) => {
    const chat = get().chats.find((c) => c.id === id)
    if (!chat) return
    const updated = await apiUpdateChat(id, { think: !chat.think })
    set((s) => ({ chats: s.chats.map((c) => (c.id === id ? updated : c)) }))
  },

  // ── Optimistic mutations for streaming ──────────────────────────────────────

  appendMessage: (chatId, msg) =>
    set((s) => ({
      messageCache: {
        ...s.messageCache,
        [chatId]: [...(s.messageCache[chatId] ?? []), msg],
      },
    })),

  appendToken: (chatId, msgId, token) =>
    set((s) => ({
      messageCache: {
        ...s.messageCache,
        [chatId]: (s.messageCache[chatId] ?? []).map((m) =>
          m.id === msgId ? { ...m, content: m.content + token } : m,
        ),
      },
    })),

  patchMessage: (chatId, msgId, patch) =>
    set((s) => ({
      messageCache: {
        ...s.messageCache,
        [chatId]: (s.messageCache[chatId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...patch } : m,
        ),
      },
    })),
}))
