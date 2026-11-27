import type { Ref } from "react"

import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { number } from "@/features/scout/helpers/player-text"
import { careerYearLabel } from "@/features/scout/helpers/season"
import type { Season } from "@/features/scout/helpers/season"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import type { SeasonReport } from "@/features/scout/types/season.types"
import * as m from "@/paraglide/messages.js"

type SeasonPosterProps = {
  player: ScoredPlayer
  season: Season
  career: SeasonReport["career"]
  /** The standing line, already worded by the page; null hides it. */
  standingText: string | null
  ref?: Ref<HTMLElement>
}

/**
 * The downloadable season poster: a fixed 540×675 layout, saved at twice the size (1080×1350, a
 * portrait social post). It never follows the site theme, so every shared poster looks the same.
 */
export function SeasonPoster({ player, season, career, standingText, ref }: SeasonPosterProps) {
  const roundMax = Math.max(1, ...season.rounds.map((round) => round.count))
  const careerMax = Math.max(1, ...career.map((entry) => entry.total))
  const stats = [
    { label: m.season_matches(), value: `${season.matches}/${season.rounds.length}` },
    { label: m.season_days(), value: number(season.activeDays) },
    { label: m.season_contributions(), value: number(season.contributions) },
    { label: m.season_streak(), value: number(season.longestStreak) }
  ]

  return (
    <article
      ref={ref}
      className="season-poster flex h-[675px] w-[540px] flex-col gap-5 overflow-hidden p-8 text-white"
    >
      <header className="flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.35em] text-white/60 uppercase">
          Gitscout
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-white/60 uppercase">
          {m.season_heading({ year: season.year })}
        </span>
      </header>

      <div className="flex gap-6">
        <div className="shrink-0 [zoom:0.62]">
          <PlayerCard player={player} occasion="new-year" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="flex flex-col gap-1">
            <span className="text-2xl leading-tight font-bold">{player.name}</span>
            {standingText ? <span className="text-sm text-white/70">{standingText}</span> : null}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="text-[11px] text-white/60">{stat.label}</dt>
                <dd className="font-mono text-2xl leading-tight font-semibold tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xs text-white/60">{m.season_form_title()}</h2>
        <div className="flex h-16 items-end gap-[2px]">
          {season.rounds.map((round) => (
            <span
              key={round.start}
              className={
                round.start === season.peakRound?.start
                  ? "season-poster-accent min-h-px flex-1 rounded-t-[2px]"
                  : "min-h-px flex-1 rounded-t-[2px] bg-white/30"
              }
              style={{ height: `${(round.count / roundMax) * 100}%` }}
            />
          ))}
        </div>
      </section>

      {career.length > 1 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs text-white/60">{m.season_career_title()}</h2>
          <div className="flex h-16 items-end gap-1">
            {career.map((entry) => (
              <span key={entry.year} className="flex h-full flex-1 flex-col items-center gap-1">
                <span className="flex w-full flex-1 flex-col justify-end">
                  <span
                    className={
                      entry.year === season.year
                        ? "season-poster-accent block min-h-px w-full rounded-t-[2px]"
                        : "block min-h-px w-full rounded-t-[2px] bg-white/30"
                    }
                    style={{ height: `${(entry.total / careerMax) * 100}%` }}
                  />
                </span>
                <span className="font-mono text-[9px] whitespace-nowrap text-white/50">
                  {careerYearLabel(entry.year, career.at(-1)?.year ?? season.year)}
                </span>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="mt-auto flex items-baseline justify-between font-mono text-xs text-white/60">
        <span>gitscout.io/u/{player.login}</span>
        <span>@{player.login}</span>
      </footer>
    </article>
  )
}
