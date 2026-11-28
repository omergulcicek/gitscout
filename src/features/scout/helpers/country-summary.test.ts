import { describe, expect, it } from "vitest"

import { countrySummary } from "@/features/scout/helpers/country-summary"
import type { ListPlayer } from "@/features/scout/types/player.types"

const player = (position: ListPlayer["position"], rarity: ListPlayer["rarity"]) =>
  ({ position, rarity }) as ListPlayer

describe("countrySummary", () => {
  it("counts players, tiers and the most common role", () => {
    const players = [
      player("Backend", "gold"),
      player("Frontend", "icon"),
      player("Frontend", "bronze"),
      player("Frontend", "bronze")
    ]
    expect(countrySummary(players)).toEqual({
      total: 4,
      rarityCounts: { icon: 1, gold: 1, silver: 0, bronze: 2 },
      topPosition: "Frontend"
    })
  })

  it("has no top role for an empty pool", () => {
    expect(countrySummary([]).topPosition).toBeNull()
  })
})
