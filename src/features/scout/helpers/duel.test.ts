import { describe, expect, it } from "vitest"

import { computeDuel } from "@/features/scout/helpers/duel"
import type { ScoredPlayer, StatKey } from "@/features/scout/types/player.types"

const player = (ovr: number, values: Record<StatKey, number>, ovrExact = ovr): ScoredPlayer => {
  const stat = (key: StatKey) => ({
    key,
    value: values[key],
    raw: values[key],
    summary: { key: "com" as const, followers: 0 },
    parts: []
  })
  return {
    login: "x",
    name: "x",
    avatarUrl: "",
    club: "",
    position: "Frontend",
    positionBreakdown: { repoCount: 0, pythonAsData: false, roles: [], languages: [] },
    topRepos: [],
    ovr,
    ovrExact,
    rarity: "gold",
    title: { stat: "act", rarity: "gold", variant: 0 },
    archetype: { rarity: "gold", strengths: [], growth: [] },
    stats: {
      act: stat("act"),
      imp: stat("imp"),
      com: stat("com"),
      rep: stat("rep"),
      con: stat("con"),
      exp: stat("exp")
    },
    year: { commits: 0, prs: 0, reviews: 0, issues: 0, activeDays: 0, longestStreak: 0 },
    career: { followers: 0, stars: 0, contributions: 0 },
    badges: [],
    fetchedAt: ""
  }
}

describe("computeDuel", () => {
  it("daha çok stat kazanan alır", () => {
    const duel = computeDuel(
      player(80, { act: 90, imp: 90, com: 90, rep: 50, con: 50, exp: 90 }),
      player(85, { act: 80, imp: 80, com: 80, rep: 60, con: 60, exp: 80 })
    )
    expect(duel.score).toEqual({ left: 4, right: 2 })
    expect(duel.winner).toBe("left")
    expect(duel.decidedBy).toBe("rounds")
  })

  it("stat sayısı eşitse genel puana bakar, o da eşitse berabere", () => {
    const left = { act: 90, imp: 90, com: 90, rep: 50, con: 50, exp: 50 }
    const right = { act: 80, imp: 80, com: 80, rep: 60, con: 60, exp: 60 }
    expect(computeDuel(player(80, left), player(85, right)).winner).toBe("right")
    const draw = computeDuel(player(80, left), player(80, right))
    expect(draw.winner).toBeNull()
    expect(draw.decidedBy).toBe("draw")
  })

  it("tam sayı puan da eşitse uzatmada ondalıklı puan karar verir", () => {
    const left = { act: 87, imp: 78, com: 70, rep: 59, con: 82, exp: 84 }
    const right = { act: 86, imp: 76, com: 77, rep: 44, con: 90, exp: 85 }
    const duel = computeDuel(player(78, left, 77.62), player(78, right, 77.9))
    expect(duel.score).toEqual({ left: 3, right: 3 })
    expect(duel.winner).toBe("right")
    expect(duel.decidedBy).toBe("ovr")
  })
})
