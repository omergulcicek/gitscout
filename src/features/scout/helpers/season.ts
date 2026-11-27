import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import type { ListPlayer, PlayerFacts, Position } from "@/features/scout/types/player.types"

/** The season the year-in-review page shows. */
export const SEASON_YEAR = 2026

/** Years on the career chart, the season included; older years still count for the career record. */
export const CAREER_CHART_YEARS = 10

/** A pool smaller than this gives a noisy percentile, so the comparison widens. */
const MIN_POOL = 30

const DAYS_PER_WEEK = 7
/** A year has 52 weeks and a day or two over; the spare days join the last week instead of a 53rd. */
const WEEKS_PER_YEAR = 52

type Day = { date: string; count: number }

export type SeasonWeek = {
  /** First day of the seven-day week (YYYY-MM-DD). */
  start: string
  count: number
}

/**
 * One calendar year of contributions, counted only from calendar days inside that year. The contribution
 * calendar counts commits, PRs, issues and reviews together, so these are contributions, not commits.
 */
export type Season = {
  year: number
  /** Last day the data covers; the season may not be over yet. */
  through: string
  contributions: number
  /** The previous calendar year's total, from GitHub's yearly totals. */
  previous: number | null
  reviews: number | null
  activeDays: number
  daysCounted: number
  /** Seven-day weeks from 1 January, at most 52; the year's spare day or two belong to the last. */
  weeks: SeasonWeek[]
  /** Weeks with at least one contribution. */
  activeWeeks: number
  longestStreak: number
  /** Most days in a row without a contribution, between the first and the last active day. */
  longestBreak: number
  /** Share of contributions made on Saturday or Sunday (0-1), or null without contributions. */
  weekendShare: number | null
  peakWeek: SeasonWeek | null
  /** Contributions per month, January first; months not reached yet are 0. */
  monthly: number[]
  /** Index of the busiest month (0 = January), or null without contributions. */
  bestMonth: number | null
}

/** Longest gap between active days; quiet days before the first or after the last don't count. */
function longestGap(days: readonly Day[]): number {
  let best = 0
  let run = 0
  let started = false
  for (const day of days) {
    if (day.count > 0) {
      if (started) best = Math.max(best, run)
      started = true
      run = 0
    } else {
      run += 1
    }
  }
  return best
}

function weekendShare(days: readonly Day[]): number | null {
  const total = days.reduce((sum, day) => sum + day.count, 0)
  if (total === 0) return null
  const weekend = days
    .filter((day) => {
      const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay()
      return weekday === 0 || weekday === 6
    })
    .reduce((sum, day) => sum + day.count, 0)
  return weekend / total
}

function longestRun(days: readonly Day[]): number {
  let best = 0
  let run = 0
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

/** The season's numbers, or null when the calendar has no day of that year. */
export function computeSeason(
  facts: Pick<PlayerFacts, "calendar" | "yearly">,
  year: number = SEASON_YEAR
): Season | null {
  const prefix = `${year}-`
  const days = facts.calendar
    .filter((day) => day.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date))
  const last = days.at(-1)
  if (!last) return null

  // Rounds come from the date, not the position, so a gap in the calendar can't shift them.
  const yearStart = Date.UTC(year, 0, 1)
  const weekOf = (date: string) =>
    Math.min(
      WEEKS_PER_YEAR - 1,
      Math.floor((Date.parse(`${date}T00:00:00Z`) - yearStart) / (DAYS_PER_WEEK * 86_400_000))
    )
  const weeks: SeasonWeek[] = Array.from({ length: weekOf(last.date) + 1 }, (_, index) => ({
    start: new Date(yearStart + index * DAYS_PER_WEEK * 86_400_000).toISOString().slice(0, 10),
    count: 0
  }))
  for (const day of days) {
    const week = weeks[weekOf(day.date)]
    if (week) week.count += day.count
  }

  const monthly = Array.from({ length: 12 }, () => 0)
  for (const day of days) {
    const month = Number(day.date.slice(5, 7)) - 1
    monthly[month] = (monthly[month] ?? 0) + day.count
  }
  const busiest = Math.max(...monthly)

  const peakWeek = weeks.reduce<SeasonWeek | null>(
    (best, week) => (week.count > (best?.count ?? 0) ? week : best),
    null
  )
  const thisYear = facts.yearly.find((entry) => entry.year === year)
  const lastYear = facts.yearly.find((entry) => entry.year === year - 1)

  return {
    year,
    through: last.date,
    contributions: days.reduce((sum, day) => sum + day.count, 0),
    previous: lastYear?.total ?? null,
    reviews: thisYear?.reviews ?? null,
    activeDays: days.filter((day) => day.count > 0).length,
    daysCounted: days.length,
    weeks,
    activeWeeks: weeks.filter((week) => week.count > 0).length,
    longestStreak: longestRun(days),
    longestBreak: longestGap(days),
    weekendShare: weekendShare(days),
    peakWeek,
    monthly,
    bestMonth: busiest > 0 ? monthly.indexOf(busiest) : null
  }
}

/** Change against the previous season in whole percent, or null when there is nothing to compare. */
export function seasonGrowth(season: Pick<Season, "contributions" | "previous">): number | null {
  if (!season.previous) return null
  return Math.round(((season.contributions - season.previous) / season.previous) * 100)
}

export type SeasonPool =
  | { scope: "country-position"; country: CountryCode; position: Position }
  | { scope: "country"; country: CountryCode }
  | { scope: "position"; position: Position }
  | { scope: "all" }

export type SeasonStanding = {
  pool: SeasonPool
  /** Players in the pool, the player excluded. */
  size: number
  /** Share of the pool with fewer active days in the last 12 months (0-1); ties count half. */
  aheadShare: number
}

/**
 * Where the player stands on active days among comparable developers: same country and position first,
 * then wider pools while the pool is too small. Uses each player's rolling last 12 months, the only
 * yearly figure stored for every player.
 */
export function seasonStanding(player: ListPlayer, all: readonly ListPlayer[]): SeasonStanding {
  const self = player.login.toLowerCase()
  const others = all.filter((other) => other.login.toLowerCase() !== self)
  const country = playerCountry(player)

  const candidates: { pool: SeasonPool; members: ListPlayer[] }[] = []
  if (country) {
    candidates.push({
      pool: { scope: "country-position", country, position: player.position },
      members: others.filter(
        (other) => playerCountry(other) === country && other.position === player.position
      )
    })
    candidates.push({
      pool: { scope: "country", country },
      members: others.filter((other) => playerCountry(other) === country)
    })
  }
  candidates.push({
    pool: { scope: "position", position: player.position },
    members: others.filter((other) => other.position === player.position)
  })

  const chosen = candidates.find((candidate) => candidate.members.length >= MIN_POOL) ?? {
    pool: { scope: "all" } as const,
    members: others
  }
  const value = player.year.activeDays
  const below = chosen.members.filter((other) => other.year.activeDays < value).length
  const equal = chosen.members.filter((other) => other.year.activeDays === value).length
  const size = chosen.members.length
  return {
    pool: chosen.pool,
    size,
    aheadShare: size === 0 ? 0 : (below + equal / 2) / size
  }
}

type YearTotal = { year: number; total: number }

/**
 * The record season before `year` and whether `year` beat it. Null when no earlier year has a
 * contribution, so a first season isn't called a record.
 */
export function careerRecord(
  career: readonly YearTotal[],
  year: number
): { previous: YearTotal; beaten: boolean } | null {
  const current = career.find((entry) => entry.year === year)
  const previous = career
    .filter((entry) => entry.year < year && entry.total > 0)
    .reduce<YearTotal | null>(
      (best, entry) => (entry.total > (best?.total ?? 0) ? entry : best),
      null
    )
  if (!current || !previous) return null
  return { previous, beaten: current.total > previous.total }
}

/**
 * Year label under a career bar: the latest year in full so the axis reads as years, the rest as two
 * digits so a long career still fits.
 */
export function careerYearLabel(year: number, latest: number): string {
  return year === latest ? String(year) : `'${String(year).slice(2)}`
}
