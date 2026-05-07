import { useState } from 'react'
import { useLogs } from '../../hooks/useLogs'
import { cn } from '../../lib/utils'
import type { LogEntry } from '../../types'

const EVENT_STYLES: Record<string, string> = {
  chat_start:    'text-accent-light bg-accent/10',
  chat_done:     'text-accent-light bg-accent/10',
  chat_error:    'text-err bg-err/10',
  analyze_start: 'text-ok bg-ok/10',
  analyze_done:  'text-ok bg-ok/10',
  analyze_error: 'text-err bg-err/10',
  health_check:  'text-warn bg-warn/10',
}

function LogRow({ entry }: { entry: LogEntry }) {
  const ts = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false })
  const event = entry.event ?? 'log'
  const ctx = Object.entries(entry)
    .filter(([k]) => !['ts', 'level', 'msg', 'event'].includes(k))
    .map(([k, v]) => `${k}=${v}`)
    .join('  ')

  return (
    <div className="grid grid-cols-[80px_110px_1fr] gap-3 px-4 py-1.5 border-b border-white/[0.03] hover:bg-surface2 animate-fadein">
      <span className="font-mono text-[11px] text-muted">{ts}</span>
      <span
        className={cn(
          'font-mono text-[10.5px] font-semibold px-1.5 rounded self-center',
          EVENT_STYLES[event] ?? 'text-muted-light bg-border',
        )}
      >
        {event}
      </span>
      <span className="font-mono text-[11px] text-muted-light truncate">{ctx}</span>
    </div>
  )
}

export function LogPanel() {
  const { entries, clear } = useLogs()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className="flex flex-col bg-surface border-t border-border" style={{ height: collapsed ? 40 : 220 }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-10 flex-shrink-0 cursor-pointer hover:bg-surface2 select-none"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-light">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          System Logs
          <span className="bg-border2 text-muted-light text-[10px] px-2 py-0.5 rounded-full min-w-[22px] text-center">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <button
            onClick={(e) => { e.stopPropagation(); clear() }}
            className="px-2 py-0.5 border border-border2 rounded hover:text-white hover:border-muted transition-colors"
          >
            Clear
          </button>
          <span>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {/* Entries */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[12px] text-muted">
              Waiting for events…
            </div>
          ) : (
            entries.map((e, i) => <LogRow key={i} entry={e} />)
          )}
        </div>
      )}
    </aside>
  )
}
