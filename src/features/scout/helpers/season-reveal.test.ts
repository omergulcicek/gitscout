import { describe, expect, it } from "vitest"

import {
  REVEAL_CLIMB_MS,
  REVEAL_STALL_MS,
  revealCount,
  revealCountMs,
  revealRarity
} from "@/features/scout/helpers/season-reveal"

describe("revealCount", () => {
  it("starts at zero and ends on the rating", () => {
    expect(revealCount(82, 0)).toBe(0)
    expect(revealCount(82, revealCountMs(82))).toBe(82)
    expect(revealCount(82, 99_999)).toBe(82)
  })

  it("waits just under each tier line it crosses", () => {
    // 82 crosses silver (65) and gold (75): two pauses.
    expect(revealCountMs(82)).toBeCloseTo(REVEAL_CLIMB_MS + 2 * REVEAL_STALL_MS)
    const atSilverStop = (64 / 82) * REVEAL_CLIMB_MS
    expect(revealCount(82, atSilverStop + REVEAL_STALL_MS / 2)).toBe(64)
  })

  it("never goes down", () => {
    let last = 0
    for (let ms = 0; ms <= revealCountMs(93); ms += 10) {
      const value = revealCount(93, ms)
      expect(value).toBeGreaterThanOrEqual(last)
      last = value
    }
  })

  it("has no pause for a bronze rating", () => {
    expect(revealCountMs(40)).toBeCloseTo(REVEAL_CLIMB_MS)
  })
})

describe("revealRarity", () => {
  it("follows the tier lines", () => {
    expect(revealRarity(50, "bronze")).toBe("bronze")
    expect(revealRarity(70, "gold")).toBe("silver")
    expect(revealRarity(80, "gold")).toBe("gold")
  })

  it("never passes the card's own tier", () => {
    expect(revealRarity(91, "gold")).toBe("gold")
  })
})
