import { Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowUpRight, Check, Swords } from "lucide-react"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { buttonVariants } from "@/components/ui/button"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { SeasonPack } from "@/features/scout/components/SeasonPack"
import { countryName } from "@/features/scout/helpers/player-country"
import { archetypeNote, number, titleText } from "@/features/scout/helpers/player-text"
import { seasonGrowth } from "@/features/scout/helpers/season"
import type { Season, SeasonStanding } from "@/features/scout/helpers/season"
import { useSeason } from "@/features/scout/hooks/use-season"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import type { SeasonReport } from "@/features/scout/types/season.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type SeasonPageProps = {
  username: string
}

const dayMonth = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  )

const monthName = (month: number, year: number) =>
  new Intl.DateTimeFormat(getLocale(), { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month, 1))
  )

export function SeasonPage({ username }: SeasonPageProps) {
  const { data } = useSeason(username)
  const { player, season } = data
  const lang = getLangParam()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-x-clip px-4 pt-2 pb-20 outline-none sm:px-6"
    >
      <Link
        to="/{-$lang}/u/$username"
        params={{ lang, username: player.login }}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ms-2 w-fit ps-2" })}
      >
        <ArrowLeft aria-hidden />
        {m.season_back()}
      </Link>

      <div className="grid gap-8 md:grid-cols-[20rem_1fr] md:items-start">
        <aside className="flex flex-col items-center gap-4 md:sticky md:top-6">
          <SeasonPack player={player} year={season.year} />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {m.season_eyebrow()}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              {player.name} · {m.season_heading({ year: season.year })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {m.season_through({ date: dayMonth(season.through) })}
            </p>
          </header>

          <SeasonStats season={season} />
          <FormChart season={season} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ScoutReport player={player} season={season} />
            <div className="flex flex-col gap-6">
              <SeasonCompare season={season} />
              <Standing standing={data.standing} />
            </div>
          </div>
          <Rival report={data} />
        </div>
      </div>
    </main>
  )
}

function SeasonStats({ season }: { season: Season }) {
  const items = [
    {
      label: m.season_matches(),
      value: `${season.matches}/${season.rounds.length}`,
      hint: m.season_matches_hint()
    },
    { label: m.season_days(), value: number(season.activeDays), hint: m.season_days_hint() },
    {
      label: m.season_contributions(),
      value: number(season.contributions),
      hint: m.season_contributions_hint()
    },
    { label: m.season_streak(), value: number(season.longestStreak), hint: m.season_streak_hint() },
    // Most players review nothing; a zero tile only adds noise.
    ...(!season.reviews
      ? []
      : [
          {
            label: m.season_reviews(),
            value: number(season.reviews),
            hint: m.season_reviews_hint()
          }
        ])
  ]

  return (
    <section aria-labelledby="season-stats-heading" className="surface flex flex-col gap-4 p-4">
      <h2 id="season-stats-heading" className="text-sm font-medium">
        {m.season_stats_title()}
      </h2>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="font-mono text-2xl leading-tight font-semibold tabular-nums">
              {item.value}
            </dd>
            <dd className="text-xs text-muted-foreground">{item.hint}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function FormChart({ season }: { season: Season }) {
  const max = Math.max(0, ...season.rounds.map((round) => round.count))
  const peak = season.peakRound

  return (
    <section aria-labelledby="season-form-heading" className="surface flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <h2 id="season-form-heading" className="text-sm font-medium">
          {m.season_form_title()}
        </h2>
        <p className="text-xs text-muted-foreground">{m.season_form_caption()}</p>
      </div>
      {max > 0 ? (
        <div
          role="img"
          aria-label={m.season_form_label({ weeks: season.rounds.length, max })}
          className="flex h-28 items-end gap-px sm:gap-0.5"
        >
          {season.rounds.map((round) => (
            <span
              key={round.start}
              className={cn(
                "min-h-px flex-1 rounded-t-[2px]",
                round.start === peak?.start ? "bg-chart-home" : "bg-muted-foreground/35"
              )}
              style={{ height: `${(round.count / max) * 100}%` }}
            />
          ))}
        </div>
      ) : null}
      <dl className="grid gap-4 sm:grid-cols-2">
        {peak ? (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{m.season_best_week()}</dt>
            <dd className="text-sm font-medium">
              {m.season_best_week_value({ date: dayMonth(peak.start), count: number(peak.count) })}
            </dd>
          </div>
        ) : null}
        {season.bestMonth === null ? null : (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{m.season_best_month()}</dt>
            <dd className="text-sm font-medium capitalize">
              {monthName(season.bestMonth, season.year)} ·{" "}
              {number(season.monthly[season.bestMonth] ?? 0)}
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function ScoutReport({ player, season }: { player: ScoredPlayer; season: Season }) {
  const growth = seasonGrowth(season)
  const advice = archetypeNote(player.archetype, player.stats).growth[0]
  const lines = [
    m.season_report_matches({ played: season.matches, total: season.rounds.length }),
    season.peakRound
      ? m.season_report_peak({
          date: dayMonth(season.peakRound.start),
          count: number(season.peakRound.count)
        })
      : null,
    season.bestMonth === null
      ? null
      : m.season_report_month({ month: monthName(season.bestMonth, season.year) }),
    growth === null || growth === 0
      ? null
      : growth > 0
        ? m.season_report_growth_up({ pct: growth })
        : m.season_report_growth_down({ pct: -growth })
  ].filter((line) => line !== null)

  return (
    <section aria-labelledby="season-report-heading" className="surface flex flex-col gap-3 p-4">
      <h2 id="season-report-heading" className="text-sm font-medium">
        {m.season_report_title()}
      </h2>
      <ul className="flex flex-col gap-2 text-sm">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-chart-home" />
            {line}
          </li>
        ))}
        {advice ? (
          <li className="flex items-start gap-2 text-muted-foreground">
            <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0" />
            {advice}
          </li>
        ) : null}
      </ul>
    </section>
  )
}

function SeasonCompare({ season }: { season: Season }) {
  if (season.previous === null) return null
  const growth = seasonGrowth(season)
  const max = Math.max(season.previous, season.contributions, 1)
  const rows = [
    { year: season.year - 1, value: season.previous, current: false },
    { year: season.year, value: season.contributions, current: true }
  ]

  return (
    <section aria-labelledby="season-compare-heading" className="surface flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="season-compare-heading" className="text-sm font-medium">
          {m.season_compare_title()}
        </h2>
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            growth !== null && growth > 0 && "text-chart-home"
          )}
        >
          {growth === null || growth === 0
            ? m.season_compare_same()
            : growth > 0
              ? m.season_compare_up({ pct: growth })
              : m.season_compare_down({ pct: -growth })}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.year} className="grid grid-cols-[3rem_1fr_4rem] items-center gap-3 text-sm">
            <span className="font-mono text-muted-foreground tabular-nums">{row.year}</span>
            <span aria-hidden className="h-2 rounded-full bg-muted">
              <span
                className={cn(
                  "block h-full rounded-full",
                  row.current ? "bg-chart-home" : "bg-muted-foreground/50"
                )}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </span>
            <span className="text-end font-mono font-semibold tabular-nums">
              {number(row.value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function poolName(standing: SeasonStanding): string {
  const { pool } = standing
  switch (pool.scope) {
    case "country-position":
      return `${countryName(pool.country)} · ${pool.position}`
    case "country":
      return countryName(pool.country)
    case "position":
      return pool.position
    case "all":
      return m.season_pool_all()
  }
}

function Standing({ standing }: { standing: SeasonStanding }) {
  if (standing.size === 0) return null
  // "Top N%": the share of the pool at or above the player, never shown as 0.
  const top = Math.max(1, Math.round((1 - standing.aheadShare) * 100))

  return (
    <section aria-labelledby="season-standing-heading" className="surface flex flex-col gap-1 p-4">
      <h2 id="season-standing-heading" className="text-sm font-medium">
        {m.season_standing_title()}
      </h2>
      <p className="font-mono text-3xl font-semibold tabular-nums">
        {m.season_standing_value({ pct: top })}
      </p>
      <p className="text-xs text-muted-foreground">
        {m.season_standing_caption({ pool: poolName(standing), size: number(standing.size) })}
      </p>
    </section>
  )
}

function Rival({ report }: { report: SeasonReport }) {
  const { rival, player } = report
  if (!rival) return null
  const lang = getLangParam()

  return (
    <section
      aria-labelledby="season-rival-heading"
      className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={avatarSrc(rival.avatarUrl, 48)}
          alt=""
          width={48}
          height={48}
          className="size-12 shrink-0 rounded-full bg-muted"
        />
        <div className="flex min-w-0 flex-col">
          <h2 id="season-rival-heading" className="text-xs text-muted-foreground">
            {m.season_rival_title()}
          </h2>
          <span className="flex items-center gap-2">
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang, username: rival.login }}
              className="truncate font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {rival.name}
            </Link>
            <RarityChip ovr={rival.ovr} rarity={rival.rarity} size="sm" />
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {titleText(rival.title)} · {m.season_rival_caption()}
          </span>
        </div>
      </div>
      <Link
        to="/{-$lang}/vs/$left/$right"
        params={{ lang, left: player.login, right: rival.login }}
        className={buttonVariants({ className: "w-fit" })}
      >
        <Swords aria-hidden />
        {m.season_rival_duel()}
      </Link>
    </section>
  )
}
