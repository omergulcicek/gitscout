import { describe, expect, it } from "vitest"

import {
  countryFromSlug,
  countrySlug,
  playersByCountry
} from "@/features/scout/helpers/country-pages"
import type { ListPlayer } from "@/features/scout/types/player.types"

describe("countrySlug", () => {
  it("turns English country names into URL segments", () => {
    expect(countrySlug("US")).toBe("united-states")
    expect(countrySlug("BR")).toBe("brazil")
  })

  it("drops accents so the segment stays ASCII", () => {
    expect(countrySlug("TR")).toMatch(/^[a-z-]+$/)
  })

  it("round-trips through countryFromSlug", () => {
    expect(countryFromSlug(countrySlug("GB"))).toBe("GB")
    expect(countryFromSlug("nowhere")).toBeUndefined()
  })
})

describe("playersByCountry", () => {
  it("groups players by country in list order and skips the unknown", () => {
    const players = [
      { login: "a", country: "TR" },
      { login: "b", country: "US" },
      { login: "c", country: "TR" },
      { login: "d" }
    ] as ListPlayer[]
    const groups = playersByCountry(players)
    expect(groups.get("TR")?.map((player) => player.login)).toEqual(["a", "c"])
    expect(groups.get("US")?.map((player) => player.login)).toEqual(["b"])
    expect(groups.size).toBe(2)
  })
})
