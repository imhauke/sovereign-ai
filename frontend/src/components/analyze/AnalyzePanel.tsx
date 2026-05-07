import { useAnalyze } from '../../hooks/useAnalyze'
import { ResultCard } from './ResultCard'

export function AnalyzePanel() {
  const { text, setText, loading, result, elapsed, error, analyze } = useAnalyze()

  function handleAnalyze() {
    if (!text.trim() || loading) return
    analyze(text)
  }

  return (
    <div className="flex h-full divide-x divide-border">
      {/* Left — input */}
      <div className="flex flex-col gap-3 w-1/2 p-5">
        <div>
          <div className="text-sm font-semibold">Paste Document</div>
          <div className="text-[11px] text-muted mt-0.5">
            Contract · Email · Clinical Note · Financial Report · Legal Brief
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-base flex-1"
          placeholder="Paste any sensitive document here. Nothing is sent to external servers."
        />
        <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Analyze Document
            </>
          )}
        </button>
      </div>

      {/* Right — result */}
      <div className="flex-1 p-5 overflow-y-auto">
        {result ? (
          <ResultCard result={result} elapsed={elapsed!} />
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-err text-center max-w-xs">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-sm text-center">Structured intelligence will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
