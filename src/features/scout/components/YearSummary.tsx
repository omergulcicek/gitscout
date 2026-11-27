import { cn } from "cn"

import { number } from "@/features/scout/helpers/player-text"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type YearSummaryProps = {
  year: ScoredPlayer["year"]
}

/**
 * Son bir yılın ham sayıları. Commit, aktif gün ve seri kıyas kartında zaten var;
 * burada yalnızca orada olmayanlar kalır.
 */
export function YearSummary({ year }: YearSummaryProps) {
  const items = [
    { label: m.year_prs(), value: number(year.prs) },
    { label: m.year_reviews(), value: number(year.reviews) },
    { label: m.year_issues(), value: number(year.issues) }
  ]

  return (
    <section
      className="flex flex-col gap-3 border-t pt-4 lg:shrink-0 lg:self-stretch lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0"
      aria-labelledby="year-heading"
    >
      <h2
        id="year-heading"
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        {m.year_title()}
      </h2>
      <dl className="grid grid-cols-3 gap-x-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="font-mono text-2xl leading-tight font-semibold tabular-nums">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      {year.weeklyTotals ? <WeeklyBars totals={year.weeklyTotals} /> : null}
    </section>
  )
}

function WeeklyBars({ totals }: { totals: number[] }) {
  const max = Math.max(0, ...totals)
  if (max === 0) return null

  return (
    <div
      role="img"
      aria-label={m.year_weekly_label({ weeks: totals.length, max })}
      className="mt-auto flex h-10 items-end gap-px"
    >
      {totals.map((total, week) => (
        // Çubuklar takvimdeki sabit haftalardır; sıra hiç değişmez.
        <span
          key={week}
          className={cn("w-1 rounded-t-[1px]", total > 0 ? "bg-chart-home" : "bg-muted")}
          style={{ height: total > 0 ? `${Math.max(8, (total / max) * 100)}%` : "2px" }}
        />
      ))}
    </div>
  )
}
