import { MiniPlayerCard } from "@/features/scout/components/MiniPlayerCard"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type DailyBestProps = {
  /** One card per role, best first; see `dailyBest`. */
  players: ListPlayer[]
}

/** The best new card of each role from the last 24 hours, above the leaderboard. */
export function DailyBest({ players }: DailyBestProps) {
  if (players.length === 0) return null

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
        {players.map((player) => (
          <li
            key={player.login}
            className="flex w-28 shrink-0 snap-start flex-col gap-1.5 lg:w-auto"
          >
            <span className="text-center text-[11px] font-medium text-muted-foreground">
              {player.position}
            </span>
            <MiniPlayerCard player={player} />
          </li>
        ))}
      </ul>
    </section>
  )
}
