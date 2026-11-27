import * as m from "@/paraglide/messages.js"

type CountryProgressBarProps = {
  total: number
  min: number
}

/** How far a country is from its own page, as a bar and "23/25". */
export function CountryProgressBar({ total, min }: CountryProgressBarProps) {
  const percent = Math.min(100, Math.round((total / min) * 100))
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={min}
        aria-valuenow={total}
        aria-label={m.top_progress_label({ count: total, min })}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
        {total}/{min}
      </span>
    </div>
  )
}
