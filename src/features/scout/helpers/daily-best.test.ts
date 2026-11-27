import { describe, expect, it } from "vitest"

import { dailyBest } from "@/features/scout/helpers/daily-best"
import type { ListPlayer } from "@/features/scout/types/player.types"

const player = (login: string, position: ListPlayer["position"], ovrExact: number) =>
  ({ login, position, ovrExact }) as ListPlayer

const players = [
  player("old-star", "Frontend", 95),
  player("fe-new", "Frontend", 80),
  player("fe-low", "Frontend", 60),
  player("be-new", "Backend", 85),
  player("mobile-a", "Mobile", 70),
  player("mobile-b", "Mobile", 70)
]

describe("dailyBest", () => {
  it("picks the best recent card of each role, best first", () => {
    const recent = ["fe-new", "FE-LOW", "be-new", "mobile-b"]
    expect(dailyBest(players, recent).map((entry) => entry.login)).toEqual([
      "be-new",
      "fe-new",
      "mobile-b"
    ])
  })

  it("breaks ties by login", () => {
    expect(dailyBest(players, ["mobile-b", "mobile-a"]).map((entry) => entry.login)).toEqual([
      "mobile-a"
    ])
  })

  it("returns nothing when no card was added", () => {
    expect(dailyBest(players, [])).toEqual([])
  })
})
