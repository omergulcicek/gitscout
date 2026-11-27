import type { Ref } from "react"

import { cn } from "cn"

import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { number } from "@/features/scout/helpers/player-text"
import { careerYearLabel } from "@/features/scout/helpers/season"
import type { Season } from "@/features/scout/helpers/season"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import type { SeasonReport } from "@/features/scout/types/season.types"
import * as m from "@/paraglide/messages.js"

/** Landscape for desktop wallpapers and posts (16:9), portrait for phone stories (9:16). */
type PosterFormat = "landscape" | "portrait"

type SeasonPosterProps = {
  format: PosterFormat
  player: ScoredPlayer
  season: Season
  career: SeasonReport["career"]
  /** The standing line, already worded by the page; null hides it. */
  standingText: string | null
  ref?: Ref<HTMLElement>
}

/**
 * The downloadable season poster, laid out at half size (960×540 or 540×960) and saved at twice that:
 * 1920×1080 or 1080×1920. It never follows the site theme, so every shared poster looks the same.
 */
export function SeasonPoster({
  format,
  player,
  season,
  career,
  standingText,
  ref
}: SeasonPosterProps) {
  const landscape = format === "landscape"
  const stats = [
    { label: m.season_matches(), value: `${season.matches}/${season.rounds.length}` },
    { label: m.season_days(), value: number(season.activeDays) },
    { label: m.season_contributions(), value: number(season.contributions) },
    { label: m.season_streak(), value: number(season.longestStreak) }
  ]

  const identity = (
    <div className={cn("flex flex-col gap-1", !landscape && "items-center text-center")}>
      <span className="text-3xl leading-tight font-bold">{player.name}</span>
      {standingText ? <span className="text-sm text-white/70">{standingText}</span> : null}
    </div>
  )

  const numbers = (
    <dl className={cn("grid gap-x-4 gap-y-3", landscape ? "grid-cols-4" : "grid-cols-2")}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col">
          <dt className="text-[11px] text-white/60">{stat.label}</dt>
          <dd className="font-mono text-3xl leading-tight font-semibold tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )

  return (
    <article
      ref={ref}
      className={cn(
        "season-poster flex flex-col overflow-hidden p-9 text-white",
        landscape ? "h-[540px] w-[960px] gap-5" : "h-[960px] w-[540px] gap-4"
      )}
    >
      <header className="flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.35em] text-white/60 uppercase">
          Gitscout
        </span>
        <span className="font-mono text-xs tracking-[0.2em] text-white/60 uppercase">
          {m.season_heading({ year: season.year })}
        </span>
      </header>

      {landscape ? (
        <div className="flex min-h-0 flex-1 gap-10">
          <div className="shrink-0 [zoom:0.8]">
            <PlayerCard player={player} occasion="new-year" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
            {identity}
            {numbers}
            <FormBars season={season} />
            <CareerBars season={season} career={career} />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-5">
          <div className="flex [zoom:0.7] justify-center">
            <PlayerCard player={player} occasion="new-year" />
          </div>
          {identity}
          {numbers}
          <FormBars season={season} />
          <CareerBars season={season} career={career} />
        </div>
      )}

      <footer className="flex items-baseline justify-between font-mono text-xs text-white/60">
        <span>gitscout.io/u/{player.login}</span>
        <span>@{player.login}</span>
      </footer>
    </article>
  )
}

function FormBars({ season }: { season: Season }) {
  const max = Math.max(1, ...season.rounds.map((round) => round.count))
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs text-white/60">{m.season_form_title()}</h2>
      <div className="flex h-14 items-end gap-[2px]">
        {season.rounds.map((round) => (
          <span
            key={round.start}
            className={cn(
              "min-h-px flex-1 rounded-t-[2px]",
              round.start === season.peakRound?.start ? "season-poster-accent" : "bg-white/30"
            )}
            style={{ height: `${(round.count / max) * 100}%` }}
          />
        ))}
      </div>
    </section>
  )
}

function CareerBars({ season, career }: { season: Season; career: SeasonReport["career"] }) {
  if (career.length < 2) return null
  const max = Math.max(1, ...career.map((entry) => entry.total))
  const latest = career.at(-1)?.year ?? season.year
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs text-white/60">{m.season_career_title()}</h2>
      <div className="flex h-14 items-end gap-1">
        {career.map((entry) => (
          <span key={entry.year} className="flex h-full flex-1 flex-col items-center gap-1">
            <span className="flex w-full flex-1 flex-col justify-end">
              <span
                className={cn(
                  "block min-h-px w-full rounded-t-[2px]",
                  entry.year === season.year ? "season-poster-accent" : "bg-white/30"
                )}
                style={{ height: `${(entry.total / max) * 100}%` }}
              />
            </span>
            <span className="font-mono text-[9px] whitespace-nowrap text-white/50">
              {careerYearLabel(entry.year, latest)}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
