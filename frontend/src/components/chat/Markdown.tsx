import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-[11px] text-muted hover:text-white transition-colors px-1">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

const components: Components = {
  // ── Headings ────────────────────────────────────────────────────────────────
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-white mt-5 mb-2 pb-1 border-b border-border">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-white mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-white mt-3 mb-1">{children}</h3>
  ),

  // ── Paragraph ───────────────────────────────────────────────────────────────
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),

  // ── Inline formatting ────────────────────────────────────────────────────────
  strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-light">{children}</em>,
  del: ({ children }) => <del className="line-through text-muted">{children}</del>,

  // ── Code ────────────────────────────────────────────────────────────────────
  code: ({ className, children }) => {
    const lang = className?.replace('language-', '') ?? ''
    const content = String(children)
    const isBlock = content.includes('\n') || !!lang

    if (isBlock) {
      const trimmed = content.replace(/\n$/, '')
      return (
        <div className="my-3 rounded-lg overflow-hidden border border-border bg-bg">
          <div className="flex items-center justify-between px-4 py-1.5 bg-surface border-b border-border">
            <span className="text-[11px] font-mono text-muted">{lang || 'code'}</span>
            <CopyButton text={trimmed} />
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-[13px] font-mono text-muted-light leading-relaxed">{trimmed}</code>
          </pre>
        </div>
      )
    }

    return (
      <code className="px-1.5 py-0.5 rounded bg-border text-accent-light font-mono text-[13px]">
        {children}
      </code>
    )
  },

  // Prevent react-markdown from wrapping block code in an extra <pre>
  pre: ({ children }) => <>{children}</>,

  // ── Lists ────────────────────────────────────────────────────────────────────
  ul: ({ children }) => (
    <ul className="list-disc list-outside ml-5 space-y-1 mb-3">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside ml-5 space-y-1 mb-3">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // ── Blockquote ───────────────────────────────────────────────────────────────
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accent/50 pl-4 my-3 italic text-muted-light">
      {children}
    </blockquote>
  ),

  // ── Links ────────────────────────────────────────────────────────────────────
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-accent-light underline underline-offset-2 hover:text-white transition-colors">
      {children}
    </a>
  ),

  // ── Divider ──────────────────────────────────────────────────────────────────
  hr: () => <hr className="border-border my-4" />,

  // ── Tables (GFM) ─────────────────────────────────────────────────────────────
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-border">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
  th: ({ children }) => (
    <th className="text-left py-2.5 px-4 font-semibold text-white text-xs uppercase tracking-wide">{children}</th>
  ),
  td: ({ children }) => (
    <td className="py-2.5 px-4 text-muted-light">{children}</td>
  ),
}

interface Props {
  content: string
}

export function Markdown({ content }: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
