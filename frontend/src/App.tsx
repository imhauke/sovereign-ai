import { useEffect } from 'react'
import { useHealth } from './hooks/useHealth'
import { useAppStore } from './store/app'
import { cn } from './lib/utils'
import { Header } from './components/layout/Header'
import { LogPanel } from './components/layout/LogPanel'
import { ChatPanel } from './components/chat/ChatPanel'
import { AnalyzePanel } from './components/analyze/AnalyzePanel'
import { CommitsPanel } from './components/commits/CommitsPanel'

type Tab = 'chat' | 'analyze' | 'commits'

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  {
    id: 'chat',
    label: 'AI Chat',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'analyze',
    label: 'Document Analyzer',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'commits',
    label: 'Commits',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
]

export function App() {
  useHealth()
  const { activeTab, setActiveTab, loadChats } = useAppStore()
  const tab = (activeTab as Tab) ?? 'chat'

  useEffect(() => { loadChats() }, [loadChats])

  return (
    <div className="flex flex-col h-full bg-bg overflow-hidden">
      <Header />

      {/* Tab bar */}
      <div className="flex gap-0.5 px-5 pt-3 border-b border-border bg-surface flex-shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 'chat' | 'analyze')}
            className={cn('tab', tab === t.id && 'tab-active')}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      <div className="flex-1 overflow-hidden">
        {tab === 'chat' && <ChatPanel />}
        {tab === 'analyze' && <AnalyzePanel />}
        {tab === 'commits' && <CommitsPanel />}
      </div>

      <LogPanel />
    </div>
  )
}
