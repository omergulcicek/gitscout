import { describe, expect, it } from "vitest"

import { stepDuration } from "@/features/scout/hooks/use-eased-count"

/** Milliseconds from the start until the count shows `value`. */
function timeUntil(value: number, target: number): number {
  let total = 0
  for (let index = 0; index < value; index++) total += stepDuration(index, target)
  return total
}

describe("stepDuration", () => {
  it("starts slow enough to read each number", () => {
    expect(stepDuration(0, 90)).toBeGreaterThanOrEqual(150)
    expect(timeUntil(15, 90)).toBeGreaterThan(1500)
  })

  it("is quickest in the middle and slows down near the score", () => {
    expect(stepDuration(40, 90)).toBeLessThan(stepDuration(5, 90))
    expect(stepDuration(40, 90)).toBeLessThan(stepDuration(85, 90))
    for (let index = 70; index < 89; index++) {
      expect(stepDuration(index + 1, 90)).toBeGreaterThanOrEqual(stepDuration(index, 90))
    }
  })

  it("never crawls once it has picked up speed", () => {
    for (let index = 20; index < 90; index++) {
      expect(stepDuration(index, 90)).toBeLessThanOrEqual(120)
    }
  })

  it("keeps each tier on screen long enough to see", () => {
    const silver = timeUntil(75, 90) - timeUntil(65, 90)
    const gold = timeUntil(90, 90) - timeUntil(75, 90)
    expect(silver).toBeGreaterThan(450)
    expect(gold).toBeGreaterThan(1000)
    expect(timeUntil(90, 90)).toBeLessThan(5500)
  })
})
