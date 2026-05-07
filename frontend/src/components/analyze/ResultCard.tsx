import { cn } from '../../lib/utils'
import type { AnalysisResult } from '../../types'

const SENTIMENT_STYLES = {
  positive: 'text-ok   border-ok/30   bg-ok/10',
  negative: 'text-err  border-err/30  bg-err/10',
  neutral:  'text-muted-light border-border2 bg-border/30',
  mixed:    'text-warn border-warn/30 bg-warn/10',
} as const

const SENTIMENT_ICON = { positive: '↑', negative: '↓', neutral: '–', mixed: '~' } as const

interface Props {
  result: AnalysisResult
  elapsed: number
}

export function ResultCard({ result, elapsed }: Props) {
  const sentiment = result.sentiment as keyof typeof SENTIMENT_STYLES

  return (
    <div className="card animate-fadein">
      {/* Doc type + sentiment row */}
      <div className="card-row flex items-center justify-between gap-4">
        <div>
          <div className="label">Document Type</div>
          <div className="font-semibold text-sm">{result.document_type}</div>
        </div>
        <span className={cn('text-xs font-semibold px-3 py-1 rounded-full border', SENTIMENT_STYLES[sentiment] ?? SENTIMENT_STYLES.neutral)}>
          {SENTIMENT_ICON[sentiment] ?? '–'} {result.sentiment}
        </span>
      </div>

      {/* Summary */}
      <div className="card-row">
        <div className="label">Summary</div>
        <p className="text-sm text-muted-light leading-relaxed">{result.summary}</p>
      </div>

      {/* Key points */}
      {result.key_points.length > 0 && (
        <div className="card-row">
          <div className="label">Key Points</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.key_points.map((p, i) => (
              <span key={i} className="tag">• {p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Action items */}
      {result.action_items.length > 0 && (
        <div className="card-row">
          <div className="label">Action Items</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.action_items.map((a, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent-light">
                → {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Risk flags */}
      {result.risk_flags.length > 0 && (
        <div className="card-row">
          <div className="label">Risk Flags</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.risk_flags.map((r, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-err/30 bg-err/10 text-red-300">
                ⚠ {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compliance */}
      {result.compliance_notes.length > 0 && (
        <div className="card-row">
          <div className="label">Compliance Notes</div>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.compliance_notes.map((c, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-warn/30 bg-warn/10 text-yellow-300">
                § {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Elapsed */}
      <div className="px-4 py-2.5 text-[11px] text-muted border-t border-border">
        Analyzed in {elapsed}s
      </div>
    </div>
  )
}
