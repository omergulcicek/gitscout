import { describe, expect, it } from "vitest"

import {
  parseCountry,
  parsePositions,
  parseRarities,
  parseStar,
  parseVerified,
  serializeCountry,
  serializePositions,
  serializeRarities,
  serializeStar,
  serializeVerified
} from "@/features/scout/helpers/filter-params"

describe("filtre parametreleri", () => {
  it("virgülle ayrılmış metni okur, bilinmeyenleri atlar", () => {
    expect(parsePositions("frontend,FullStack, xyz")).toEqual(["Frontend", "Full Stack"])
    expect(parseRarities("gold,silver,platin")).toEqual(["gold", "silver"])
    expect(parsePositions(undefined)).toEqual([])
  })

  it("boş listeyi URL'den kaldırır", () => {
    expect(serializePositions(["Game Dev", "Data"])).toBe("gamedev,data")
    expect(serializeRarities([])).toBeUndefined()
  })

  it("ülkeyi okur; belirsizi tanır, bilinmeyen değeri atlar", () => {
    expect(parseCountry("TR")).toBe("TR")
    expect(parseCountry(" tr ")).toBe("TR")
    expect(parseCountry("unknown")).toBe("unknown")
    expect(parseCountry("xx")).toBeUndefined()
    expect(serializeCountry("TR")).toBe("tr")
    expect(serializeCountry(undefined)).toBeUndefined()
  })

  it("GitHub Star filtresini yalnızca star değeriyle açar", () => {
    expect(parseStar("star")).toBe(true)
    expect(parseStar("STAR")).toBe(true)
    expect(parseStar("1")).toBe(false)
    expect(parseStar(undefined)).toBe(false)
    expect(serializeStar(true)).toBe("star")
    expect(serializeStar(false)).toBeUndefined()
  })

  it("onaylı filtresini yalnızca 1 değeriyle açar", () => {
    expect(parseVerified(1)).toBe(true)
    expect(parseVerified(0)).toBe(false)
    expect(parseVerified(undefined)).toBe(false)
    expect(serializeVerified(true)).toBe(1)
    expect(serializeVerified(false)).toBeUndefined()
  })
})
