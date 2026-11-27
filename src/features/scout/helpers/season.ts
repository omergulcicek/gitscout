import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import type { ListPlayer, PlayerFacts, Position } from "@/features/scout/types/player.types"

/** The season the year-in-review page shows. */
export const SEASON_YEAR = 2026

/** A pool smaller than this gives a noisy percentile, so the comparison widens. */
const MIN_POOL = 30

const DAYS_PER_ROUND = 7

type Day = { date: string; count: number }

export type SeasonRound = {
  /** First day of the seven-day round (YYYY-MM-DD). */
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
  daysPlayed: number
  /** Seven-day rounds from 1 January; a round with any contribution is a match played. */
  rounds: SeasonRound[]
  matches: number
  longestStreak: number
  peakRound: SeasonRound | null
  /** Contributions per month, January first; months not reached yet are 0. */
  monthly: number[]
  /** Index of the busiest month (0 = January), or null without contributions. */
  bestMonth: number | null
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
  const roundOf = (date: string) =>
    Math.floor((Date.parse(`${date}T00:00:00Z`) - yearStart) / (DAYS_PER_ROUND * 86_400_000))
  const rounds: SeasonRound[] = Array.from({ length: roundOf(last.date) + 1 }, (_, index) => ({
    start: new Date(yearStart + index * DAYS_PER_ROUND * 86_400_000).toISOString().slice(0, 10),
    count: 0
  }))
  for (const day of days) {
    const round = rounds[roundOf(day.date)]
    if (round) round.count += day.count
  }

  const monthly = Array.from({ length: 12 }, () => 0)
  for (const day of days) {
    const month = Number(day.date.slice(5, 7)) - 1
    monthly[month] = (monthly[month] ?? 0) + day.count
  }
  const busiest = Math.max(...monthly)

  const peakRound = rounds.reduce<SeasonRound | null>(
    (best, round) => (round.count > (best?.count ?? 0) ? round : best),
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
    daysPlayed: days.length,
    rounds,
    matches: rounds.filter((round) => round.count > 0).length,
    longestStreak: longestRun(days),
    peakRound,
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
