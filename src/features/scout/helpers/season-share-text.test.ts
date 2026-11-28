import { describe, expect, it } from "vitest"

import { computeSeason } from "@/features/scout/helpers/season"
import type { SeasonStanding } from "@/features/scout/helpers/season"
import { seasonShareText } from "@/features/scout/helpers/season-share-text"
import type { SeasonShareInput } from "@/features/scout/helpers/season-share-text"

const days = Array.from({ length: 60 }, (_, index) => ({
  date: new Date(Date.UTC(2025, 0, 1 + index * 5)).toISOString().slice(0, 10),
  count: 3
}))

const standing: SeasonStanding = {
  pool: { scope: "country-position", country: "TR", position: "Frontend" },
  size: 120,
  aheadShare: 0.66
}

const season = computeSeason(
  {
    calendar: days,
    yearly: [
      { year: 2025, total: 180 },
      { year: 2024, total: 90 }
    ]
  },
  2025
)
if (!season) throw new Error("The fixture should make a season")

const input = (final: boolean): SeasonShareInput => ({
  card: { login: "octocat", ovr: 78, rarity: "gold", position: "Frontend" },
  season,
  standing,
  final
})

describe("seasonShareText", () => {
  it("looks back on a closed season and links to that year's report", () => {
    const text = seasonShareText(input(true), "linkedin", "tr")
    expect(text).toContain("2025 sezonumu GitHub'da kapattım")
    expect(text).toContain("⭐ Sezon kartı: 78 · Altın · Frontend")
    expect(text).toContain("📈 Geçen yıla göre %100 artış")
    expect(text).toContain("Türkiye · Frontend içinde ilk %34")
    expect(text).toContain("/tr/u/octocat/season?year=2025")
  })

  it("names the pool in the text's own language", () => {
    expect(seasonShareText(input(true), "linkedin", "en")).toContain(
      "Top 34% in Türkiye · Frontend"
    )
  })

  it("speaks of the running year before it is over", () => {
    expect(seasonShareText(input(false), "x", "en")).toContain("before the year is out")
  })

  it("keeps the X post within 280 characters, the link counted as 23", () => {
    const text = seasonShareText(input(true), "x", "tr")
    const url = text.split("\n").at(-1) ?? ""
    expect(text.length - url.length + 23).toBeLessThanOrEqual(280)
  })
})
