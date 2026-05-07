import { create } from 'zustand'
import { uid } from '../lib/utils'
import type { Chat, Message } from '../types'

type Tab = 'chat' | 'analyze'
type ModelStatus = 'loading' | 'online' | 'error'

function makeChat(): Chat {
  return { id: uid(), title: 'New Chat', messages: [], think: false, createdAt: new Date() }
}

const first = makeChat()

interface AppState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  modelStatus: ModelStatus
  modelLabel: string
  setModel: (status: ModelStatus, label: string) => void

  // Chat list
  chats: Chat[]
  activeChatId: string
  createChat: () => void
  setActiveChatId: (id: string) => void
  deleteChat: (id: string) => void
  setChatTitle: (chatId: string, title: string) => void
  setThink: (chatId: string, think: boolean) => void

  // Message mutations
  appendMessage: (chatId: string, msg: Message) => void
  appendToken: (chatId: string, msgId: string, token: string) => void
  patchMessage: (chatId: string, msgId: string, patch: Partial<Message>) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
  modelStatus: 'loading',
  modelLabel: 'Connecting…',
  setModel: (modelStatus, modelLabel) => set({ modelStatus, modelLabel }),

  chats: [first],
  activeChatId: first.id,

  createChat: () => {
    const chat = makeChat()
    set((s) => ({ chats: [chat, ...s.chats], activeChatId: chat.id }))
  },

  setActiveChatId: (id) => set({ activeChatId: id }),

  deleteChat: (id) =>
    set((s) => {
      const remaining = s.chats.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        const fresh = makeChat()
        return { chats: [fresh], activeChatId: fresh.id }
      }
      const nextId = s.activeChatId === id ? remaining[0].id : s.activeChatId
      return { chats: remaining, activeChatId: nextId }
    }),

  setChatTitle: (chatId, title) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, title } : c)),
    })),

  setThink: (chatId, think) =>
    set((s) => ({
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, think } : c)),
    })),

  appendMessage: (chatId, msg) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c,
      ),
    })),

  // Uses set's function form so it always reads latest content — safe for streaming
  appendToken: (chatId, msgId, token) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId ? { ...m, content: m.content + token } : m,
              ),
            }
          : c,
      ),
    })),

  patchMessage: (chatId, msgId, patch) =>
    set((s) => ({
      chats: s.chats.map((c) =>
        c.id === chatId
          ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) }
          : c,
      ),
    })),
}))
