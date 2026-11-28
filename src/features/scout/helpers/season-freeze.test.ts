import { describe, expect, it } from "vitest"

import { computeSeason } from "@/features/scout/helpers/season"
import {
  frozenSeasonFacts,
  isFreezeWindow,
  isSeasonClosed,
  seasonCounts
} from "@/features/scout/helpers/season-freeze"
import type { FrozenSeason } from "@/features/scout/types/season.types"

function yearDays(year: number, count = (index: number) => index % 3) {
  const start = Date.UTC(year, 0, 1)
  const length = (Date.UTC(year + 1, 0, 1) - start) / 86_400_000
  return Array.from({ length }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: count(index)
  }))
}

describe("isSeasonClosed", () => {
  it("opens on 2 January of the next year", () => {
    expect(isSeasonClosed(2026, new Date("2026-12-31T23:59:59Z"))).toBe(false)
    expect(isSeasonClosed(2026, new Date("2027-01-01T23:59:59Z"))).toBe(false)
    expect(isSeasonClosed(2026, new Date("2027-01-02T00:00:00Z"))).toBe(true)
  })
})

describe("isFreezeWindow", () => {
  it("is open through January of the next year only", () => {
    expect(isFreezeWindow(2026, new Date("2027-01-01T12:00:00Z"))).toBe(false)
    expect(isFreezeWindow(2026, new Date("2027-01-02T00:00:00Z"))).toBe(true)
    expect(isFreezeWindow(2026, new Date("2027-01-31T23:59:59Z"))).toBe(true)
    expect(isFreezeWindow(2026, new Date("2027-02-01T00:00:00Z"))).toBe(false)
  })
})

describe("seasonCounts", () => {
  it("keeps a full year in date order", () => {
    const days = yearDays(2025)
    const counts = seasonCounts([...days].reverse(), 2025)
    expect(counts).toHaveLength(365)
    expect(counts?.slice(0, 4)).toEqual([0, 1, 2, 0])
  })

  it("handles a leap year", () => {
    expect(seasonCounts(yearDays(2028), 2028)).toHaveLength(366)
  })

  it("ignores days outside the year", () => {
    const days = [{ date: "2024-12-31", count: 9 }, ...yearDays(2025)]
    expect(seasonCounts(days, 2025)).toHaveLength(365)
  })

  it("refuses a year with a missing day", () => {
    const days = yearDays(2025).filter((day) => day.date !== "2025-06-01")
    expect(seasonCounts(days, 2025)).toBeNull()
  })
})

describe("frozenSeasonFacts", () => {
  it("gives back the calendar and the season's own totals", () => {
    const counts = yearDays(2025).map((day) => day.count)
    const row: FrozenSeason = {
      format: 1,
      login: "me",
      githubId: 1,
      year: 2025,
      counts,
      total: counts.reduce((sum, count) => sum + count, 0),
      reviews: 3,
      yearly: [
        { year: 2025, total: 1 },
        { year: 2024, total: 100 }
      ],
      card: {
        ovr: 70,
        rarity: "silver",
        position: "Frontend",
        title: { stat: "act", rarity: "silver", variant: 0 }
      } as FrozenSeason["card"]
    }
    const facts = frozenSeasonFacts(row)
    expect(facts.calendar.at(-1)).toEqual({ date: "2025-12-31", count: counts.at(-1) })
    const season = computeSeason(facts, 2025)
    expect(season?.contributions).toBe(row.total)
    expect(season?.previous).toBe(100)
    expect(season?.reviews).toBe(3)
    expect(season?.weeks).toHaveLength(52)
  })
})
