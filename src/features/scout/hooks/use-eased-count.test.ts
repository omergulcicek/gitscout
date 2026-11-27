import { describe, expect, it } from "vitest"

import { stepDuration } from "@/features/scout/hooks/use-eased-count"

describe("stepDuration", () => {
  it("starts slow enough to read each number and speeds up every step", () => {
    expect(stepDuration(0)).toBeGreaterThanOrEqual(150)
    for (let index = 1; index < 40; index++) {
      expect(stepDuration(index)).toBeLessThanOrEqual(stepDuration(index - 1))
    }
  })

  it("keeps the first 15 steps readable and rushes the last stretch", () => {
    expect(stepDuration(14)).toBeGreaterThan(50)
    expect(stepDuration(60)).toBeLessThan(20)
  })
})
