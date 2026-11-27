import { describe, expect, it } from "vitest"

import { leaderboardFacets, queryLeaderboard } from "@/features/scout/helpers/leaderboard-query"
import { leaderboardSearchDefaults } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"

// Only the fields the query reads; the list arrives sorted by OVR like the server cache.
const player = (
  login: string,
  name: string,
  ovrExact: number,
  extra: Partial<ListPlayer> = {}
): ListPlayer =>
  ({
    login,
    name,
    ovrExact,
    ovr: Math.round(ovrExact),
    position: "Frontend",
    rarity: "gold",
    stats: { act: { value: 50 } },
    ...extra
  }) as ListPlayer

const players = [
  player("ada", "Ada", 90, { rarity: "icon", claimedCountry: "TR", verified: true }),
  player("bob", "bob", 85, {
    position: "Backend",
    stats: { act: { value: 70 } } as ListPlayer["stats"]
  }),
  player("cem", "Cem", 85, { position: "Backend", claimedCountry: "TR" }),
  player("deniz", "Önder Deniz", 70, { rarity: "silver" }),
  player("eda", "Eda", 60, {
    rarity: "bronze",
    stats: { act: { value: 70 } } as ListPlayer["stats"]
  })
]

const base = { ...leaderboardSearchDefaults }
const logins = (list: { login: string }[]) => list.map((entry) => entry.login)

describe("queryLeaderboard", () => {
  it("returns everyone by OVR with ranks", () => {
    const result = queryLeaderboard(players, base, "en")
    expect(logins(result.players)).toEqual(["ada", "bob", "cem", "deniz", "eda"])
    expect(result.players.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5])
    expect(result).toMatchObject({ matched: 5, total: 5 })
  })

  it("ranks inside the filtered pool", () => {
    const result = queryLeaderboard(players, { ...base, pos: "backend" }, "en")
    expect(logins(result.players)).toEqual(["bob", "cem"])
    expect(result.players.map((entry) => entry.rank)).toEqual([1, 2])
    expect(result).toMatchObject({ matched: 2, total: 5 })
  })

  it("keeps the real rank when searching", () => {
    const result = queryLeaderboard(players, { ...base, q: "onder" }, "tr")
    expect(result.players).toMatchObject([{ login: "deniz", rank: 4 }])
  })

  it("applies country, rarity and verified filters", () => {
    expect(logins(queryLeaderboard(players, { ...base, country: "tr" }, "en").players)).toEqual([
      "ada",
      "cem"
    ])
    expect(logins(queryLeaderboard(players, { ...base, rarity: "silver" }, "en").players)).toEqual([
      "deniz"
    ])
    expect(logins(queryLeaderboard(players, { ...base, verified: 1 }, "en").players)).toEqual([
      "ada"
    ])
  })

  it("sorts names case-insensitively", () => {
    const result = queryLeaderboard(players, { ...base, sort: "name", dir: "asc" }, "en")
    expect(logins(result.players)).toEqual(["ada", "bob", "cem", "eda", "deniz"])
  })

  it("breaks ties by OVR order in both directions", () => {
    const desc = queryLeaderboard(players, { ...base, sort: "act", dir: "desc" }, "en")
    expect(logins(desc.players)).toEqual(["bob", "eda", "ada", "cem", "deniz"])
    const asc = queryLeaderboard(players, { ...base, sort: "act", dir: "asc" }, "en")
    expect(logins(asc.players)).toEqual(["ada", "cem", "deniz", "bob", "eda"])
  })

  it("slices after sorting and still reports the full match count", () => {
    const result = queryLeaderboard(players, { ...base, sort: "ovr", dir: "asc", limit: 2 }, "en")
    expect(logins(result.players)).toEqual(["eda", "deniz"])
    expect(result.matched).toBe(5)
  })
})

describe("leaderboardFacets", () => {
  it("summarizes the whole list", () => {
    expect(leaderboardFacets(players)).toMatchObject({
      total: 5,
      rarityCounts: { icon: 1, gold: 2, silver: 1, bronze: 1 },
      positions: ["Frontend", "Backend"],
      hasVerified: true,
      countries: [{ country: "TR", count: 2 }],
      unknownCountry: 3
    })
  })
})
