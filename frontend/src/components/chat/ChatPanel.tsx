import { useEffect, useRef } from 'react'
import { useChat } from '../../hooks/useChat'
import { cn } from '../../lib/utils'
import type { Message } from '../../types'
import { ChatInput } from './ChatInput'
import { ChatSidebar } from './ChatSidebar'
import { Markdown } from './Markdown'

function MessageBubble({ msg, isLast, streaming }: { msg: Message; isLast: boolean; streaming: boolean }) {
  const isUser = msg.role === 'user'
  const showCursor = !isUser && isLast && streaming

  return (
    <div className={cn('flex gap-3 animate-fadein', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5',
          isUser ? 'bg-accent text-white' : 'bg-surface2 text-accent-light border border-border2',
        )}
      >
        {isUser ? 'U' : '◈'}
      </div>
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-xl text-sm leading-relaxed max-w-[580px]',
            isUser
              ? 'bg-accent text-white'
              : cn('bg-surface border border-border text-white', msg.error && 'border-err/40 text-err'),
          )}
        >
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
          ) : (
            <Markdown content={msg.content} />
          )}
          {showCursor && (
            <span className="inline-block w-0.5 h-[14px] bg-accent-light animate-blink ml-0.5 align-middle" />
          )}
        </div>
        {msg.meta && (
          <span className="text-[11px] text-muted">
            {msg.meta.tokens} tokens · {msg.meta.elapsed}s
          </span>
        )}
      </div>
    </div>
  )
}

export function ChatPanel() {
  const { messages, send, streaming, think, toggleThink } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="m-auto flex flex-col items-center gap-4 text-center max-w-sm">
              <span className="text-4xl text-accent-light">◈</span>
              <h2 className="text-xl font-bold">Sovereign AI</h2>
              <p className="text-sm text-muted-light">
                Your data never leaves this machine.<br />
                Powered by <strong className="text-white">Qwen 3.5 · 9B</strong> running locally.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {['HIPAA-ready', 'GDPR-ready', 'SOC2-ready', 'Air-gapped'].map((t) => (
                  <span key={t} className="tag text-[11px]">{t}</span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={msg.id} msg={msg} isLast={i === messages.length - 1} streaming={streaming} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={send} disabled={streaming} think={think} onThinkToggle={toggleThink} />
      </div>
    </div>
  )
}
