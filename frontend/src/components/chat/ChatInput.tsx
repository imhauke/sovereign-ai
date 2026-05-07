import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'

interface Props {
  onSend: (msg: string) => void
  disabled: boolean
  think: boolean
  onThinkToggle: () => void
}

export function ChatInput({ onSend, disabled, think, onThinkToggle }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [hasText, setHasText] = useState(false)

  function handleSend() {
    const val = ref.current?.value.trim()
    if (!val || disabled) return
    onSend(val)
    if (ref.current) {
      ref.current.value = ''
      ref.current.style.height = 'auto'
      ref.current.style.overflowY = 'hidden'
      setHasText(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = ref.current
    if (!el) return
    el.style.height = '43px'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
    // Scrollbar only appears when there are explicit line breaks
    el.style.overflowY = el.value.includes('\n') ? 'auto' : 'hidden'
    setHasText(el.value.trim().length > 0)
  }

  return (
    <div className="flex gap-2 items-stretch px-5 py-3.5 border-t border-border bg-surface flex-shrink-0">
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder="Ask anything…"
        className="input-base flex-1 max-h-[140px] box-border"
        style={{ overflowY: 'hidden', height: '43px' }}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
      />

      {/* Deep reasoning toggle — fixed h-10, stays at bottom */}
      <button
        onClick={onThinkToggle}
        disabled={disabled}
        title={think ? 'Deep reasoning ON — click to disable' : 'Deep reasoning OFF — click to enable'}
        className={cn(
          'h-[43px] w-12 flex-shrink-0 flex items-center justify-center rounded-lg border transition-all',
          think
            ? 'border-accent/60 bg-accent/15 text-accent-light shadow-[0_0_10px_rgba(99,102,241,0.25)]'
            : 'border-border2 text-muted hover:border-muted hover:text-muted-light',
        )}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.16Z"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.16Z"/>
        </svg>
      </button>

      {/* Send — fixed h-10, muted purple when empty, full accent when has text */}
      <button
        onClick={handleSend}
        disabled={disabled || !hasText}
        className={cn(
          'h-[43px] w-12 flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200',
          hasText && !disabled
            ? 'bg-accent hover:bg-accent-light text-white border border-transparent'
            : 'bg-accent/15 border border-accent/25 text-accent-light/40 cursor-not-allowed',
        )}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}
