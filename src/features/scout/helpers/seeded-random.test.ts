import { describe, expect, it } from "vitest"

import { seededRandom } from "@/features/scout/helpers/seeded-random"

describe("seededRandom", () => {
  it("produces the exact same sequence for the same seed", () => {
    const a = seededRandom(12345)
    const b = seededRandom(12345)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it("produces different sequences for different seeds within [0, 1)", () => {
    const a = seededRandom(1)
    const b = seededRandom(2)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).not.toEqual(seqB)
    for (const value of [...seqA, ...seqB]) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
