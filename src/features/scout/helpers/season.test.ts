import { describe, expect, it } from "vitest"

import {
  careerRecord,
  computeSeason,
  seasonGrowth,
  seasonStanding
} from "@/features/scout/helpers/season"
import type { ListPlayer } from "@/features/scout/types/player.types"

const day = (date: string, count: number) => ({ date, count })

function days(from: string, counts: number[]) {
  const start = new Date(`${from}T00:00:00Z`).getTime()
  return counts.map((count, index) =>
    day(new Date(start + index * 86_400_000).toISOString().slice(0, 10), count)
  )
}

describe("computeSeason", () => {
  const calendar = [
    ...days("2025-12-29", [9, 9, 9]),
    ...days("2026-01-01", [1, 2, 0, 3, 4, 5, 0, 0, 0, 0, 0, 0, 0, 0, 10]),
    ...days("2026-02-01", [7])
  ]
  const yearly = [
    { year: 2026, total: 32, reviews: 4 },
    { year: 2025, total: 16 }
  ]

  it("counts only days inside the season year", () => {
    const season = computeSeason({ calendar, yearly }, 2026)
    expect(season?.contributions).toBe(32)
    expect(season?.through).toBe("2026-02-01")
    expect(season?.activeDays).toBe(7)
    expect(season?.daysPlayed).toBe(16)
    expect(season?.previous).toBe(16)
    expect(season?.reviews).toBe(4)
  })

  it("splits the season into seven-day rounds from 1 January", () => {
    const season = computeSeason({ calendar, yearly }, 2026)
    expect(season?.rounds).toEqual([
      { start: "2026-01-01", count: 15 },
      { start: "2026-01-08", count: 0 },
      { start: "2026-01-15", count: 10 },
      { start: "2026-01-22", count: 0 },
      { start: "2026-01-29", count: 7 }
    ])
    expect(season?.matches).toBe(3)
    expect(season?.peakRound).toEqual({ start: "2026-01-01", count: 15 })
  })

  it("finds the longest streak, the busiest month and monthly totals", () => {
    const season = computeSeason({ calendar, yearly }, 2026)
    expect(season?.longestStreak).toBe(3)
    expect(season?.bestMonth).toBe(0)
    expect(season?.monthly.slice(0, 3)).toEqual([25, 7, 0])
  })

  it("returns null without any day in the year", () => {
    expect(computeSeason({ calendar: days("2025-01-01", [1]), yearly: [] }, 2026)).toBeNull()
  })
})

describe("seasonGrowth", () => {
  it("compares with the previous season", () => {
    expect(seasonGrowth({ contributions: 1855, previous: 851 })).toBe(118)
    expect(seasonGrowth({ contributions: 50, previous: 100 })).toBe(-50)
    expect(seasonGrowth({ contributions: 50, previous: null })).toBeNull()
    expect(seasonGrowth({ contributions: 50, previous: 0 })).toBeNull()
  })
})

describe("seasonStanding", () => {
  const player = (
    login: string,
    activeDays: number,
    position: ListPlayer["position"],
    country?: string
  ) => ({ login, position, country, year: { activeDays } }) as unknown as ListPlayer

  it("uses the country and position pool when it is big enough", () => {
    const pool = Array.from({ length: 30 }, (_, index) =>
      player(`p${index}`, index, "Frontend", "TR")
    )
    const me = player("me", 15, "Frontend", "TR")
    const standing = seasonStanding(me, [me, ...pool])
    expect(standing.pool).toEqual({
      scope: "country-position",
      country: "TR",
      position: "Frontend"
    })
    expect(standing.size).toBe(30)
    expect(standing.aheadShare).toBeCloseTo(15.5 / 30)
  })

  it("widens a small pool to the country", () => {
    const pool = [
      ...Array.from({ length: 5 }, (_, index) => player(`f${index}`, 1, "Frontend", "TR")),
      ...Array.from({ length: 30 }, (_, index) => player(`b${index}`, 1, "Backend", "TR"))
    ]
    const me = player("me", 2, "Frontend", "TR")
    const standing = seasonStanding(me, [me, ...pool])
    expect(standing.pool).toEqual({ scope: "country", country: "TR" })
    expect(standing.aheadShare).toBe(1)
  })

  it("falls back to everyone when no pool is big enough", () => {
    const me = player("me", 2, "Frontend")
    const standing = seasonStanding(me, [me, player("x", 1, "Backend")])
    expect(standing.pool).toEqual({ scope: "all" })
    expect(standing.size).toBe(1)
  })
})

describe("careerRecord", () => {
  const career = [
    { year: 2018, total: 348 },
    { year: 2019, total: 252 },
    { year: 2025, total: 851 },
    { year: 2026, total: 600 }
  ]

  it("compares the season with the best earlier one", () => {
    expect(careerRecord(career, 2026)).toEqual({
      previous: { year: 2025, total: 851 },
      beaten: false
    })
    expect(careerRecord(career, 2025)).toEqual({
      previous: { year: 2018, total: 348 },
      beaten: true
    })
  })

  it("has no record for a first season", () => {
    expect(careerRecord([{ year: 2026, total: 10 }], 2026)).toBeNull()
    expect(
      careerRecord(
        [
          { year: 2025, total: 0 },
          { year: 2026, total: 10 }
        ],
        2026
      )
    ).toBeNull()
  })
})
