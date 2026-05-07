import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CommitNode {
  sha: string
  sha_full: string
  message: string
  author: string
  date: string
  url: string
}

interface CommitFile {
  filename: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  additions: number
  deletions: number
  patch?: string | null
}

interface CommitDetail extends CommitNode {
  body: string
  stats: { additions: number; deletions: number; total: number }
  files: CommitFile[]
}

// ── Utils ──────────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString()
}

// ── Diff renderer ──────────────────────────────────────────────────────────────

function DiffView({ patch }: { patch: string }) {
  const lines = patch.split('\n')
  return (
    <pre className="text-[11.5px] font-mono leading-relaxed overflow-x-auto">
      {lines.map((line, i) => (
        <div
          key={i}
          className={
            line.startsWith('+') ? 'text-ok bg-ok/5 px-3' :
            line.startsWith('-') ? 'text-err bg-err/5 px-3' :
            line.startsWith('@@') ? 'text-accent-light/60 px-3' :
            'text-muted-light px-3'
          }
        >
          {line || ' '}
        </div>
      ))}
    </pre>
  )
}

// ── File card ──────────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string> = { added: 'A', modified: 'M', deleted: 'D', renamed: 'R' }
const STATUS_COLOR: Record<string, string> = {
  added:    'text-ok bg-ok/15 border-ok/25',
  modified: 'text-warn bg-warn/10 border-warn/20',
  deleted:  'text-err bg-err/10 border-err/20',
  renamed:  'text-accent-light bg-accent/10 border-accent/20',
}

function FileCard({ file }: { file: CommitFile }) {
  const [open, setOpen] = useState(false)
  const hasPatch = !!file.patch

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 bg-surface ${hasPatch ? 'cursor-pointer hover:bg-surface2' : ''} transition-colors`}
        onClick={() => hasPatch && setOpen(o => !o)}
      >
        <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-[10px] font-bold border ${STATUS_COLOR[file.status] ?? STATUS_COLOR.modified}`}>
          {STATUS_ICON[file.status] ?? 'M'}
        </span>
        <span className="flex-1 text-[12.5px] font-mono text-muted-light truncate">{file.filename}</span>
        <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
          {file.additions > 0 && <span className="text-ok">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-err">-{file.deletions}</span>}
          {hasPatch && <span className="text-muted">{open ? '▲' : '▼'}</span>}
        </div>
      </div>
      {open && file.patch && (
        <div className="border-t border-border bg-bg overflow-x-auto max-h-[340px] overflow-y-auto">
          <DiffView patch={file.patch} />
        </div>
      )}
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────

function DetailPanel({ detail, loading }: { detail: CommitDetail | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
        <span className="w-5 h-5 border-2 border-muted/20 border-t-accent rounded-full animate-spin" />
        <span className="text-sm">Fetching commit details…</span>
      </div>
    )
  }
  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted select-none">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
          <circle cx="12" cy="12" r="3" /><line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
        </svg>
        <p className="text-sm">Select a commit</p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Commit header */}
      <div className="mb-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <code className="text-[12px] text-accent-light/80 font-mono">{detail.sha}</code>
            <h2 className="text-base font-bold text-white mt-1 leading-snug">{detail.message}</h2>
            {detail.body && (
              <pre className="text-[12px] text-muted-light mt-2 whitespace-pre-wrap font-sans leading-relaxed">
                {detail.body}
              </pre>
            )}
          </div>
          <a href={detail.url} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-[12px] text-muted hover:text-white border border-border2 hover:border-muted px-2.5 py-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            GitHub
          </a>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 text-[12px] text-muted">
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {detail.author}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {new Date(detail.date).toLocaleString()}
          </span>
        </div>

        {/* Stats bar */}
        {detail.stats && (
          <div className="flex items-center gap-4 mt-4 text-[12px]">
            <span className="text-ok font-mono">+{detail.stats.additions}</span>
            <span className="text-err font-mono">-{detail.stats.deletions}</span>
            <span className="text-muted">{detail.files?.length ?? 0} files changed</span>
            {/* Visual bar */}
            <div className="flex gap-0.5 flex-1 max-w-[160px] h-2 rounded-full overflow-hidden bg-border">
              {detail.stats.total > 0 && (
                <>
                  <div className="bg-ok rounded-l" style={{ width: `${Math.round(detail.stats.additions / detail.stats.total * 100)}%` }} />
                  <div className="bg-err rounded-r" style={{ width: `${Math.round(detail.stats.deletions / detail.stats.total * 100)}%` }} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Files */}
      <div className="flex flex-col gap-2">
        {(detail.files ?? []).map((f, i) => <FileCard key={i} file={f} />)}
      </div>
    </div>
  )
}

// ── Commit tree row ────────────────────────────────────────────────────────────

function CommitRow({
  commit, isLast, isSelected, onClick,
}: {
  commit: CommitNode; isLast: boolean; isSelected: boolean; onClick: () => void
}) {
  return (
    <div className="flex cursor-pointer group select-none" onClick={onClick}>
      {/* Timeline */}
      <div className="flex flex-col items-center w-9 flex-shrink-0 pt-0.5">
        <div className={`w-3 h-3 rounded-full border-2 z-10 flex-shrink-0 transition-all duration-150 ${
          isSelected
            ? 'bg-accent border-accent shadow-[0_0_8px_rgba(99,102,241,0.7)]'
            : 'bg-bg border-border2 group-hover:border-accent/50'
        }`} />
        {!isLast && <div className="w-px flex-1 bg-border2 mt-1.5" />}
      </div>

      {/* Info */}
      <div className={`flex-1 min-w-0 pb-4 pr-3 rounded-lg transition-colors ${
        isSelected ? 'text-white' : 'text-muted group-hover:text-muted-light'
      }`}>
        <div className="flex items-center gap-2">
          <code className={`text-[10.5px] font-mono flex-shrink-0 transition-colors ${
            isSelected ? 'text-accent-light' : 'text-muted group-hover:text-accent-light/60'
          }`}>{commit.sha}</code>
        </div>
        <p className="text-[13px] font-medium leading-snug mt-0.5 truncate pr-2">{commit.message}</p>
        <p className="text-[11px] mt-0.5 opacity-70">{commit.author} · {relativeTime(commit.date)}</p>
      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export function CommitsPanel() {
  const [commits, setCommits] = useState<CommitNode[]>([])
  const [loadingCommits, setLoadingCommits] = useState(true)
  const [selectedSha, setSelectedSha] = useState<string | null>(null)
  const [detail, setDetail] = useState<CommitDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadCommits(force = false) {
    setLoadingCommits(true)
    setError(null)
    try {
      const url = force ? '/api/agent/commits?limit=20&refresh=true' : '/api/agent/commits?limit=20'
      const r = await fetch(url)
      if (!r.ok) throw new Error(`${r.status}`)
      const d = await r.json()
      setCommits(d.commits ?? [])
      // If served from cache, re-fetch after 5s to pick up background task results
      if (!force && d.source === 'cache') {
        setTimeout(async () => {
          try {
            const r2 = await fetch('/api/agent/commits?limit=20')
            const d2 = await r2.json()
            setCommits(d2.commits ?? [])
          } catch { /* silent */ }
        }, 5000)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoadingCommits(false)
    }
  }

  async function selectCommit(sha_full: string) {
    if (selectedSha === sha_full) return
    setSelectedSha(sha_full)
    setDetail(null)
    setLoadingDetail(true)
    try {
      const r = await fetch(`/api/agent/commit/${sha_full}`)
      const d = await r.json()
      setDetail(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => { loadCommits() }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-surface flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted flex-shrink-0">
          <circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="13"/>
          <circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="12" y1="13" x2="6" y2="16"/><line x1="12" y1="13" x2="18" y2="16"/>
        </svg>
        <span className="text-sm font-semibold">imhauke / sovereign-ai</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border2 text-muted">main</span>
        <div className="ml-auto flex items-center gap-2">
          {commits.length > 0 && (
            <span className="text-[11px] text-muted">{commits.length} commits</span>
          )}
          <button
            onClick={() => loadCommits(true)}
            disabled={loadingCommits}
            className="flex items-center gap-1.5 text-[12px] text-muted hover:text-white px-2.5 py-1.5 rounded-lg border border-border2 hover:border-muted transition-all disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={loadingCommits ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: commit tree */}
        <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto py-4 px-3">
          {loadingCommits ? (
            <div className="flex flex-col gap-4 px-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-border2 mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-border2 rounded w-3/4" />
                    <div className="h-2.5 bg-border rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="px-3 py-6 text-center">
              <p className="text-[12px] text-err mb-3">{error}</p>
              <button onClick={loadCommits} className="text-xs border border-border2 px-3 py-1.5 rounded hover:text-white transition-colors">
                Retry
              </button>
            </div>
          ) : (
            commits.map((c, i) => (
              <CommitRow
                key={c.sha_full}
                commit={c}
                isLast={i === commits.length - 1}
                isSelected={selectedSha === c.sha_full}
                onClick={() => selectCommit(c.sha_full)}
              />
            ))
          )}
        </div>

        {/* Right: detail panel */}
        <div className="flex-1 overflow-hidden">
          <DetailPanel detail={detail} loading={loadingDetail} />
        </div>
      </div>
    </div>
  )
}
