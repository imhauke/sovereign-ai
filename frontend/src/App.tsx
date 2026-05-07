import { useEffect } from 'react'
import { useHealth } from './hooks/useHealth'
import { useAppStore } from './store/app'
import { cn } from './lib/utils'
import { Header } from './components/layout/Header'
import { LogPanel } from './components/layout/LogPanel'
import { ChatPanel } from './components/chat/ChatPanel'
import { AnalyzePanel } from './components/analyze/AnalyzePanel'

const TABS = [
  {
    id: 'chat' as const,
    label: 'AI Chat',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'analyze' as const,
    label: 'Document Analyzer',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
]

export function App() {
  useHealth()
  const { activeTab, setActiveTab, loadChats } = useAppStore()

  // Load chats from DB on mount — same as Claude/ChatGPT do on first page load
  useEffect(() => { loadChats() }, [loadChats])

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">
      <Header />

      {/* Tab bar */}
      <div className="flex gap-0.5 px-5 pt-3 border-b border-border bg-surface flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn('tab', activeTab === tab.id && 'tab-active')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? <ChatPanel /> : <AnalyzePanel />}
      </div>

      <LogPanel />
    </div>
  )
}
