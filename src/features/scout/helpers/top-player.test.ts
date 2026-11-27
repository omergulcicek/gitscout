import { describe, expect, it } from "vitest"

import { toTopPlayer } from "@/features/scout/helpers/top-player"
import type { ListPlayer } from "@/features/scout/types/player.types"

const stats = Object.fromEntries(
  ["act", "imp", "com", "rep", "con", "exp"].map((key, i) => [key, { key, value: 50 + i }])
)

const player = (login: string) =>
  ({
    login,
    name: "Ada",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    ovr: 81,
    ovrExact: 81.3,
    rarity: "gold",
    position: "Frontend",
    badges: [{ id: "polyglot" }],
    stats
  }) as unknown as ListPlayer

describe("ilk 100 oyuncusu", () => {
  it("sırayı birden sayar, statları düz sayıya indirir, fazlalık alanları atar", () => {
    expect(toTopPlayer(player("nobody-xyz"), 0)).toEqual({
      rank: 1,
      login: "nobody-xyz",
      name: "Ada",
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      ovr: 81,
      rarity: "gold",
      position: "Frontend",
      country: null,
      stats: { act: 50, imp: 51, com: 52, rep: 53, con: 54, exp: 55 }
    })
  })

  it("veritabanındaki ülkeyi taşır", () => {
    expect(toTopPlayer({ ...player("ademilter"), claimedCountry: "TR" }, 4)).toMatchObject({
      rank: 5,
      country: "TR"
    })
  })
})
