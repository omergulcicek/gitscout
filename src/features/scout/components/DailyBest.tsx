import { getRouteApi, Link } from "@tanstack/react-router"
import { Plus } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { MiniPlayerCard } from "@/features/scout/components/MiniPlayerCard"
import { TopViewSwitch } from "@/features/scout/components/TopViewSwitch"
import type { TopView } from "@/features/scout/components/TopViewSwitch"
import type { DailyBestSlot } from "@/features/scout/helpers/daily-best"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

const routeApi = getRouteApi("/{-$lang}/leaderboard")

type DailyBestProps = {
  /** Every role in a fixed order, for everyone and for Türkiye; see `dailyBest`. */
  slots: Record<TopView, DailyBestSlot[]>
}

const hasPlayers = (slots: DailyBestSlot[]) => slots.some((slot) => slot.player !== null)

/** The best new card of each role from the last 24 hours, above the leaderboard. */
export function DailyBest({ slots }: DailyBestProps) {
  const { top } = routeApi.useSearch()
  // Same rule as the home page's top 10: Türkiye by default on the Turkish page, everyone in English.
  const canSwitch = getLocale() === "tr" && hasPlayers(slots.tr)
  const view: TopView = canSwitch && top !== "world" ? "tr" : "world"
  if (!hasPlayers(slots.world)) return null

  return (
    <section className="flex flex-col gap-3" aria-labelledby="daily-best-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="daily-best-heading" className="text-lg font-semibold">
            {m.daily_best_title()}
          </h2>
          {canSwitch ? <TopViewSwitch view={view} label={m.daily_best_switch_label()} /> : null}
        </div>
        <p className="text-sm text-muted-foreground">{m.daily_best_hint()}</p>
      </div>
      {/* Scrolls on its own on narrow screens; the eight roles fit one row on wide ones. */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0 lg:pb-0">
        {slots[view].map(({ position, player }) => (
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
