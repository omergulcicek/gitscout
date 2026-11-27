import { describe, expect, it } from "vitest"

import {
  countPlayerCountries,
  playerCountry,
  playerCountryFilter
} from "@/features/scout/helpers/player-country"

describe("oyuncu ülkesi", () => {
  it("veritabanındaki ülke GitHub konumunun önüne geçer", () => {
    expect(playerCountry({ login: "fatih", country: "DE", claimedCountry: "TR" })).toBe("TR")
    expect(playerCountry({ login: "octocat", country: "DE", claimedCountry: "JP" })).toBe("JP")
  })

  it("veritabanında ülke yoksa ya da tanınmıyorsa GitHub konumundan çıkarılanı kullanır", () => {
    expect(playerCountry({ login: "octocat", country: "DE" })).toBe("DE")
    expect(playerCountry({ login: "octocat", country: "DE", claimedCountry: null })).toBe("DE")
    expect(playerCountry({ login: "octocat", country: "DE", claimedCountry: "XX" })).toBe("DE")
    expect(playerCountry({ login: "octocat", country: "XX" })).toBeUndefined()
    expect(playerCountry({ login: "octocat" })).toBeUndefined()
  })

  it("ülkesi bilinmeyeni belirsiz sayar", () => {
    expect(playerCountryFilter({ login: "octocat" })).toBe("unknown")
    expect(playerCountryFilter({ login: "fatih", claimedCountry: "TR" })).toBe("TR")
  })

  it("ülkeleri sayar, belirsizleri ayrı tutar", () => {
    const players = [
      { login: "fatih", claimedCountry: "TR" },
      { login: "rakyll", country: "US", claimedCountry: "TR" },
      { login: "torvalds", country: "FI" },
      { login: "octocat" }
    ]
    expect(countPlayerCountries(players)).toEqual({
      countries: [
        { country: "TR", count: 2 },
        { country: "FI", count: 1 }
      ],
      unknown: 1
    })
  })
})
