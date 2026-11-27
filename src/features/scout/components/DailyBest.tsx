import { Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { MiniPlayerCard } from "@/features/scout/components/MiniPlayerCard"
import type { DailyBestSlot } from "@/features/scout/helpers/daily-best"
import * as m from "@/paraglide/messages.js"

type DailyBestProps = {
  /** Every role in a fixed order; see `dailyBest`. */
  slots: DailyBestSlot[]
}

/** The best new card of each role from the last 24 hours, above the leaderboard. */
export function DailyBest({ slots }: DailyBestProps) {
  if (slots.every((slot) => slot.player === null)) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="daily-best-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="daily-best-heading" className="text-lg font-semibold">
          {m.daily_best_title()}
        </h2>
        <p className="text-sm text-muted-foreground">{m.daily_best_hint()}</p>
      </div>
      {/* Scrolls on its own on narrow screens; the eight roles fit one row on wide ones. */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0 lg:pb-0">
        {slots.map(({ position, player }) => (
          <li key={position} className="flex w-28 shrink-0 snap-start flex-col gap-1.5 lg:w-auto">
            <span className="text-center text-[11px] font-medium text-muted-foreground">
              {position}
            </span>
            {player ? (
              <MiniPlayerCard player={player} />
            ) : (
              // An empty role keeps its place and invites the visitor to fill it.
              <Link
                to="/{-$lang}"
                params={{ lang: getLangParam() }}
                aria-label={m.daily_best_empty_label({ position })}
                className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-2 py-3 text-center text-muted-foreground transition-colors outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Plus aria-hidden className="size-5" />
                <span className="text-xs font-semibold">{m.daily_best_empty()}</span>
                <span className="text-[11px]">{m.daily_best_empty_cta()}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
