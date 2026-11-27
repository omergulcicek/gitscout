import { describe, expect, it } from "vitest"

import { similarPlayers } from "@/features/scout/helpers/similar-players"
import type { ListPlayer } from "@/features/scout/types/player.types"

const player = (login: string, position: ListPlayer["position"], ovrExact: number) =>
  ({ login, position, ovrExact }) as ListPlayer

// Sorted by OVR like the cached leaderboard.
const players = [
  player("a", "Backend", 95),
  player("b", "Frontend", 90),
  player("d", "Backend", 86),
  player("me", "Backend", 85),
  player("c", "Backend", 84),
  player("e", "Backend", 70),
  player("f", "Backend", 60)
]

describe("similarPlayers", () => {
  it("returns the same position, closest OVR first, without the player", () => {
    const me = { login: "me", position: "Backend" as const, ovrExact: 85 }
    expect(similarPlayers(me, players).map((entry) => entry.login)).toEqual(["d", "c", "a", "e"])
  })

  it("breaks ties by leaderboard order", () => {
    const me = { login: "ME", position: "Backend" as const, ovrExact: 85 }
    expect(similarPlayers(me, players, 2).map((entry) => entry.login)).toEqual(["d", "c"])
  })
})
