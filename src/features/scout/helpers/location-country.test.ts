import { describe, expect, it } from "vitest"

import { countryFromLocation } from "@/features/scout/helpers/location-country"

describe("konumdan ülke", () => {
  it.each([
    ["Istanbul, Turkey", "TR"],
    ["İstanbul", "TR"],
    ["ISTANBUL", "TR"],
    ["Türkiye 🇹🇷", "TR"],
    ["Izmir / Türkiye", "TR"],
    ["Ankara", "TR"],
    ["Istanbul, TR", "TR"],
    ["San Francisco, CA", "US"],
    ["Paris, Texas", "US"],
    ["Berlin, Germany", "DE"],
    ["München", "DE"],
    ["London, UK", "GB"],
    ["Remote - Netherlands", "NL"],
    ["🇯🇵 Tokyo", "JP"],
    ["Tehran, Iran", "IR"],
    ["Azərbaycan, Baku", "AZ"],
    ["Zurich, Switzerland", "CH"],
    ["Albuquerque, New Mexico", "US"],
    ["Phoenix, AZ", undefined],
    ["Aotearoa", "NZ"],
    ["Tripoli, Libya", "LY"],
    ["Ashgabat", "TM"]
  ])("%s → %s", (location, country) => {
    expect(countryFromLocation(location)).toBe(country)
  })

  it.each(["Indiana", "Nigeriana", "Earth", "Remote", "", "   ", null, undefined])(
    "%s için ülke bulamaz",
    (location) => {
      expect(countryFromLocation(location)).toBeUndefined()
    }
  )
})
