import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/app'

export function Header() {
  const { modelStatus, modelLabel } = useAppStore()

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-surface flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="text-2xl text-accent-light">◈</span>
        <div>
          <div className="text-base font-bold tracking-tight leading-none">Sovereign</div>
          <div className="text-[11px] text-muted mt-0.5">Private AI for regulated industries</div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3">
        <div className="text-[11px] px-3 py-1 rounded-full border border-ok/20 bg-ok/10 text-ok">
          🔒 Zero data egress
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-light bg-surface2 border border-border rounded-full px-3 py-1.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              modelStatus === 'online' && 'bg-ok shadow-[0_0_6px_#22c55e]',
              modelStatus === 'loading' && 'bg-muted animate-pulse',
              modelStatus === 'error' && 'bg-err',
            )}
          />
          {modelLabel}
        </div>
      </div>
    </header>
  )
}
