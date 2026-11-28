import { describe, expect, it } from "vitest"

import { rarityRange } from "@/features/scout/helpers/rarity-range"

describe("rarityRange", () => {
  it("formats readable score ranges for every rarity tier", () => {
    expect(rarityRange("icon")).toBe("90+")
    expect(rarityRange("gold")).toBe("75–89")
    expect(rarityRange("silver")).toBe("65–74")
    expect(rarityRange("bronze")).toBe("0–64")
  })
})
