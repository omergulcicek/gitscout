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

const slots = (recent: string[]) =>
  dailyBest(players, recent).map((slot) => [slot.position, slot.player?.login ?? null])

describe("dailyBest", () => {
  it("keeps every role in a fixed order with the best recent card or an empty slot", () => {
    expect(slots(["fe-new", "FE-LOW", "be-new", "mobile-b"])).toEqual([
      ["Frontend", "fe-new"],
      ["Backend", "be-new"],
      ["Full Stack", null],
      ["DevOps", null],
      ["Mobile", "mobile-b"],
      ["Data", null],
      ["Systems", null],
      ["Game Dev", null]
    ])
  })

  it("breaks ties by login", () => {
    expect(slots(["mobile-b", "mobile-a"])).toContainEqual(["Mobile", "mobile-a"])
  })

  it("leaves every slot empty when no card was added", () => {
    expect(dailyBest(players, []).every((slot) => slot.player === null)).toBe(true)
  })
})
