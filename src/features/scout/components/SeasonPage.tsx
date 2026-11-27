import { useEffect, useState } from "react"

import { Link } from "@tanstack/react-router"
import { ArrowLeft, Check, Monitor, Smartphone, Swords } from "lucide-react"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { Button, buttonVariants } from "@/components/ui/button"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { SeasonPack } from "@/features/scout/components/SeasonPack"
import { SeasonPoster } from "@/features/scout/components/SeasonPoster"
import { SeasonSnow } from "@/features/scout/components/SeasonSnow"
import { countryName } from "@/features/scout/helpers/player-country"
import { number, titleText } from "@/features/scout/helpers/player-text"
import {
  CAREER_CHART_YEARS,
  careerRecord,
  careerYearLabel,
  seasonGrowth
} from "@/features/scout/helpers/season"
import type { Season, SeasonStanding } from "@/features/scout/helpers/season"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import { useSeason } from "@/features/scout/hooks/use-season"
import type { SeasonReport } from "@/features/scout/types/season.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/** Below this many quiet days in a row, a break isn't worth a line in the report. */
const MIN_BREAK_DAYS = 3

/** Flakes on screen normally and during the pack's reveal, and how long the flurry lasts. */
const LIGHT_FLAKES = 160
const FLURRY_FLAKES = 650
const FLURRY_MS = 6000

type SeasonPageProps = {
  username: string
  /** A past season to show; the current one when missing. */
  year?: number
}

const dayMonth = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  )

/** Whose report it is: the person's own reads "you", anyone else's reads "they". */
type Voice = "own" | "other"

const shortMonth = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  )

const monthName = (month: number, year: number) =>
  new Intl.DateTimeFormat(getLocale(), { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month, 1))
  )

export function SeasonPage({ username, year }: SeasonPageProps) {
  const { data } = useSeason(username, year)
  const { player, season } = data
  const lang = getLangParam()
  const { data: viewer } = useViewer()
  // The viewer arrives after the first paint; until then the report reads in the third person.
  const voice: Voice = viewer?.login.toLowerCase() === player.login.toLowerCase() ? "own" : "other"
  const {
    cardRef: landscapeRef,
    download: downloadLandscape,
    isDownloading: landscapeDownloading
  } = useCardDownload(`gitscout-${player.login}-${season.year}-16x9`)
  const {
    cardRef: portraitRef,
    download: downloadPortrait,
    isDownloading: portraitDownloading
  } = useCardDownload(`gitscout-${player.login}-${season.year}-9x16`)
  const top = standingTop(data.standing)
  // Light snow all the time; a flurry while the pack opens, then it settles back.
  const [flurry, setFlurry] = useState(false)
  useEffect(() => {
    if (!flurry) return
    const timer = window.setTimeout(() => setFlurry(false), FLURRY_MS)
    return () => window.clearTimeout(timer)
  }, [flurry])
  const standingText =
    top === null ? null : `${m.season_standing_value({ pct: top })} · ${poolName(data.standing)}`

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-x-clip px-4 pt-2 pb-20 outline-none sm:px-6"
    >
      <SeasonSnow count={flurry ? FLURRY_FLAKES : LIGHT_FLAKES} />
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
          <SeasonPack
            player={data.card}
            year={season.year}
            voice={voice}
            onOpen={() => setFlurry(true)}
            actions={
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadLandscape}
                  disabled={landscapeDownloading}
                >
                  <Monitor aria-hidden />
                  {landscapeDownloading ? m.download_preparing() : m.season_poster_landscape()}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadPortrait}
                  disabled={portraitDownloading}
                >
                  <Smartphone aria-hidden />
                  {portraitDownloading ? m.download_preparing() : m.season_poster_portrait()}
                </Button>
              </>
            }
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              {m.season_eyebrow()}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              {player.name} · {m.season_heading({ year: season.year })}
            </h1>
            {top === null ? null : (
              <p className="mt-1 text-sm">
                <span className="font-semibold">
                  {m.season_standing_value({ pct: top })} · {poolName(data.standing)}
                </span>{" "}
                <span className="text-muted-foreground">({m.season_standing_basis()})</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {data.final ? m.season_final() : m.season_through({ date: dayMonth(season.through) })}
            </p>
          </header>

          <SeasonStats season={season} />
          <FormChart season={season} />
          <CareerChart season={season} career={data.career} final={data.final} />
          <ScoutReport season={season} career={data.career} voice={voice} />
          <Rival report={data} voice={voice} />
        </div>
      </div>

      {/* Off-screen copy that the download captures; the inner node has no position of its own. */}
      <div aria-hidden inert className="pointer-events-none fixed top-0 -left-[10000px]">
        <SeasonPoster
          ref={landscapeRef}
          format="landscape"
          player={data.card}
          season={season}
          career={data.career}
          standingText={standingText}
        />
        <SeasonPoster
          ref={portraitRef}
          format="portrait"
          player={data.card}
          season={season}
          career={data.career}
          standingText={standingText}
        />
      </div>
    </main>
  )
}

function SeasonStats({ season }: { season: Season }) {
  const items = [
    {
      label: m.season_weeks(),
      value: `${season.activeWeeks}/${season.weeks.length}`,
      hint: m.season_weeks_hint()
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
  const max = Math.max(0, ...season.weeks.map((week) => week.count))
  const peak = season.peakWeek

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
          aria-label={m.season_form_label({ weeks: season.weeks.length, max })}
          className="flex h-28 items-end gap-px sm:gap-0.5"
        >
          {season.weeks.map((week) => (
            <span
              key={week.start}
              className={cn(
                "min-h-px flex-1 rounded-t-[2px]",
                week.start === peak?.start ? "bg-chart-home" : "bg-muted-foreground/35"
              )}
              style={{ height: `${(week.count / max) * 100}%` }}
            />
          ))}
        </div>
      ) : null}
      {max > 0 ? (
        // One label under the first week of each month; the row mirrors the bars' spacing.
        <div aria-hidden className="-mt-2 flex gap-px sm:gap-0.5">
          {season.weeks.map((week, index) => {
            const month = week.start.slice(5, 7)
            const starts = index === 0 || season.weeks[index - 1]?.start.slice(5, 7) !== month
            return (
              <span key={week.start} className="relative h-3.5 flex-1">
                {starts ? (
                  <span className="absolute start-0 font-mono text-[10px] whitespace-nowrap text-muted-foreground capitalize">
                    {shortMonth(week.start)}
                  </span>
                ) : null}
              </span>
            )
          })}
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

function ScoutReport({
  season,
  career,
  voice
}: {
  season: Season
  career: SeasonReport["career"]
  voice: Voice
}) {
  const own = voice === "own"
  const record = careerRecord(career, season.year)
  // Weekend share in tenths reads better than a percentage, which needs a suffix that changes in Turkish.
  const weekendTenths = season.weekendShare === null ? null : Math.round(season.weekendShare * 10)
  // Only what the panels above don't already say.
  const lines = [
    record === null
      ? null
      : record.beaten
        ? m.season_report_record({
            year: record.previous.year,
            count: number(record.previous.total)
          })
        : (own ? m.season_report_record_held_own : m.season_report_record_held_other)({
            year: record.previous.year,
            count: number(record.previous.total)
          }),
    season.longestBreak >= MIN_BREAK_DAYS
      ? (own ? m.season_report_break_own : m.season_report_break_other)({
          days: season.longestBreak
        })
      : null,
    weekendTenths === null
      ? null
      : weekendTenths === 0
        ? (own ? m.season_report_weekend_none_own : m.season_report_weekend_none_other)()
        : (own ? m.season_report_weekend_own : m.season_report_weekend_other)({
            count: weekendTenths
          })
  ].filter((line) => line !== null)
  if (lines.length === 0) return null

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
      </ul>
    </section>
  )
}

function CareerChart({
  season,
  career,
  final
}: {
  season: Season
  career: SeasonReport["career"]
  final: boolean
}) {
  const years = career.slice(-CAREER_CHART_YEARS)
  if (years.length < 2) return null
  const change = seasonGrowth(season)
  // An unfinished year against a whole one only ever looks short, so a fall shows once the season closes.
  const growth = change !== null && (final || change > 0) ? change : null
  const max = Math.max(1, ...years.map((entry) => entry.total))
  const first = years[0]
  const last = years.at(-1)

  return (
    <section aria-labelledby="season-career-heading" className="surface flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 id="season-career-heading" className="text-sm font-medium">
            {m.season_career_title()}
          </h2>
          <p className="text-xs text-muted-foreground">
            {m.season_career_caption({ years: years.length })}
          </p>
        </div>
        {growth === null ? null : (
          <span
            className={cn(
              "shrink-0 font-mono text-sm font-semibold tabular-nums",
              growth > 0 && "text-chart-home"
            )}
          >
            {growth === 0
              ? m.season_compare_same()
              : growth > 0
                ? m.season_compare_up({ pct: growth })
                : m.season_compare_down({ pct: -growth })}
          </span>
        )}
      </div>
      <ol
        aria-label={m.season_career_label({
          from: first?.year ?? season.year,
          to: last?.year ?? season.year,
          max: number(max)
        })}
        className="flex h-36 items-end gap-1"
      >
        {years.map((entry) => {
          const current = entry.year === season.year
          return (
            <li key={entry.year} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
              <span className="flex w-full flex-1 flex-col justify-end">
                <span
                  className={cn(
                    "block min-h-px w-full rounded-t-[3px]",
                    current ? "bg-chart-home" : "bg-muted-foreground/35"
                  )}
                  style={{ height: `${(entry.total / max) * 100}%` }}
                />
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] whitespace-nowrap tabular-nums",
                  current ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {careerYearLabel(entry.year, last?.year ?? season.year)}
              </span>
              <span className="sr-only">
                {entry.year}: {number(entry.total)}
              </span>
            </li>
          )
        })}
      </ol>
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

/** "Top N%": the share of the pool at or above the player, never shown as 0. Null for an empty pool. */
function standingTop(standing: SeasonStanding): number | null {
  if (standing.size === 0) return null
  return Math.max(1, Math.round((1 - standing.aheadShare) * 100))
}

function Rival({ report, voice }: { report: SeasonReport; voice: Voice }) {
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
          <span className="text-xs text-muted-foreground">
            {titleText(rival.title)} ·{" "}
            {voice === "own" ? m.season_rival_caption_own() : m.season_rival_caption_other()}
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
