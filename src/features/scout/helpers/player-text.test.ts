import { describe, expect, it } from "vitest"

import {
  archetypeNote,
  badgeDetail,
  badgeName,
  clubLabel,
  number,
  partLabel,
  percent,
  rarityLabel,
  statLabel,
  statShort,
  statSummary,
  titleText
} from "@/features/scout/helpers/player-text"
import type { Stat, StatKey } from "@/features/scout/types/player.types"

const makeStat = (key: StatKey, summary: Stat["summary"]): Stat => ({
  key,
  value: 80,
  raw: 70,
  summary,
  parts: []
})

const SAMPLE_STATS: Record<StatKey, Stat> = {
  act: makeStat("act", { key: "act", contributions: 15_400 }),
  imp: makeStat("imp", { key: "imp", stars: 12_345, forks: 2_100 }),
  com: makeStat("com", { key: "com", followers: 1_500 }),
  rep: makeStat("rep", { key: "rep", prs: 250, reviews: 80 }),
  con: makeStat("con", { key: "con", days: 200, streak: 45 }),
  exp: makeStat("exp", { key: "exp", years: 7, contributions: 25_000 })
}

describe("number & percent", () => {
  it("rounds and formats numbers according to locale", () => {
    expect(number(1234.6, "en")).toBe("1,235")
    expect(number(1234.6, "tr")).toBe("1.235")
  })

  it("formats percentages using the active locale", () => {
    expect(percent(45)).toBe("45%")
  })
})

describe("stat & part labels", () => {
  it("resolves statLabel, statShort, statSummary, and partLabel for all stat keys", () => {
    expect(statLabel("act")).toBe("Activity")
    expect(statShort("act", "en")).toBe("ACT")
    expect(statShort("act", "tr")).toBe("AKT")
    expect(statShort("exp", "tr")).toBe("KDM")

    expect(statSummary(SAMPLE_STATS.act.summary)).toContain("15,400")
    expect(statSummary(SAMPLE_STATS.imp.summary)).toContain("12,345")
    expect(statSummary(SAMPLE_STATS.com.summary)).toContain("1,500")
    expect(statSummary(SAMPLE_STATS.rep.summary)).toContain("250")
    expect(statSummary(SAMPLE_STATS.con.summary)).toContain("200")
    expect(statSummary(SAMPLE_STATS.exp.summary)).toContain("25,000")

    expect(partLabel("act_contributions")).toBe("Contributions (last 12 months)")
    expect(partLabel("exp_lifetime")).toBe("Total contributions")
  })
})

describe("rarity, club, badge, and title helpers", () => {
  it("formats rarity and club labels in en and tr", () => {
    expect(rarityLabel("icon", "en")).toBe("Icon")
    expect(rarityLabel("icon", "tr")).toBe("İkon")
    expect(clubLabel("Vercel", "en")).toBe("Vercel")
    expect(clubLabel(null, "en")).toBe("Independent")
    expect(clubLabel(null, "tr")).toBe("Bağımsız")
  })

  it("formats badge names and details across badge types", () => {
    expect(badgeName("night-owl", "en")).toBe("Night Owl")
    expect(badgeName("night-owl", "tr")).toBe("Gece Kuşu")
    expect(badgeDetail({ id: "night-owl", values: { pct: 35 } })).toContain("35%")
    expect(badgeDetail({ id: "marathon", values: { days: 42 } })).toContain("42")
    expect(
      badgeDetail({ id: "polyglot", values: { count: 5, languages: "TS, Go, Rust, Python, CSS" } })
    ).toContain("TS, Go, Rust, Python, CSS")
    expect(badgeDetail({ id: "first-verified", values: { order: 3, total: 10 } })).toContain("#3")
    expect(badgeDetail({ id: "milestone-card", values: { order: 1000 } })).toContain("1,000")
  })

  it("resolves title variants and falls back to variant 0 for out-of-range indices", () => {
    expect(titleText({ stat: "act", rarity: "icon", variant: 1 }, "en")).toBe("Contribution Giant")
    expect(titleText({ stat: "act", rarity: "icon", variant: 99 }, "en")).toBe(
      "Icon of Productivity"
    )
    expect(titleText({ stat: "rep", rarity: "gold", variant: 0 }, "tr")).toBe("Güvenilir Katkıcı")
  })
})

describe("archetypeNote", () => {
  it("formats compact large numbers in strengths and resolves growth tips by locale", () => {
    const enNote = archetypeNote(
      { rarity: "gold", strengths: ["act", "imp"], growth: ["rep"] },
      SAMPLE_STATS,
      "en"
    )
    expect(enNote.strengths[0]).toContain("15.4K")
    expect(enNote.strengths[1]).toContain("12.3K")
    expect(enNote.growth).toHaveLength(1)

    const trNote = archetypeNote(
      { rarity: "gold", strengths: ["com"], growth: ["con"] },
      SAMPLE_STATS,
      "tr"
    )
    expect(trNote.strengths[0]).toContain("1.500")
    expect(trNote.growth).toHaveLength(1)
  })

  it("falls back to legacy single weakness when growth is omitted", () => {
    const note = archetypeNote(
      { rarity: "silver", strengths: ["con"], weakness: "exp" },
      SAMPLE_STATS,
      "en"
    )
    expect(note.strengths).toHaveLength(1)
    expect(note.growth).toHaveLength(1)
  })
})
