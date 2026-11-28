import type { FrozenSeason } from "@/features/scout/types/season.types"

const DAY_MS = 86_400_000

/**
 * A season can be frozen once it is clearly over: from 2 January (UTC) of the next year, so late
 * contributions from any time zone on 31 December are already counted.
 */
export function isSeasonClosed(year: number, now: Date): boolean {
  return now.getTime() >= Date.UTC(year + 1, 0, 2)
}

/**
 * A season is frozen only during January of the next year. The card in the row is the card on the day
 * of freezing, so a season frozen in, say, June would carry a card from a different year.
 */
export function isFreezeWindow(year: number, now: Date): boolean {
  return isSeasonClosed(year, now) && now.getTime() < Date.UTC(year + 1, 1, 1)
}

/**
 * The year's daily counts from 1 January, in order. Null when GitHub's calendar doesn't cover the
 * whole year without gaps, so a partial year is never frozen.
 */
export function seasonCounts(
  days: readonly { date: string; count: number }[],
  year: number
): number[] | null {
  const inYear = days
    .filter((day) => day.date.startsWith(`${year}-`))
    .sort((a, b) => a.date.localeCompare(b.date))
  const expected = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY_MS
  if (inYear.length !== expected) return null
  const start = Date.UTC(year, 0, 1)
  const ordered = inYear.every(
    (day, index) => day.date === new Date(start + index * DAY_MS).toISOString().slice(0, 10)
  )
  return ordered ? inYear.map((day) => day.count) : null
}

/** The frozen counts back as calendar days, plus the yearly totals with the season's own figures. */
export function frozenSeasonFacts(row: FrozenSeason): {
  calendar: { date: string; count: number }[]
  yearly: FrozenSeason["yearly"]
} {
  const start = Date.UTC(row.year, 0, 1)
  return {
    calendar: row.counts.map((count, index) => ({
      date: new Date(start + index * DAY_MS).toISOString().slice(0, 10),
      count
    })),
    yearly: [
      { year: row.year, total: row.total, reviews: row.reviews },
      ...row.yearly.filter((entry) => entry.year !== row.year)
    ]
  }
}
