import { describe, expect, it } from "vitest"

import { simulateShard } from "@/features/scout/helpers/shard-physics"
import type { ShardLaunch } from "@/features/scout/helpers/shard-physics"

const launch: ShardLaunch = {
  center: [160, 200],
  radius: 20,
  vx: 0.6,
  vy: -0.8,
  spin: 0.4,
  floor: 700,
  left: -300,
  right: 600
}

describe("simulateShard", () => {
  it("starts where the piece is", () => {
    expect(simulateShard(launch, 1000, 40)[0]).toEqual({ x: 0, y: 0, angle: 0 })
  })

  it("rises first, then falls to the floor and stays there", () => {
    const frames = simulateShard(launch, 3000, 40)
    const lowest = launch.floor - launch.center[1] - launch.radius * 0.45
    expect(frames[3]?.y).toBeLessThan(0)
    const last = frames.at(-1)
    expect(last?.y).toBeCloseTo(lowest)
    expect(frames.at(-2)?.x).toBeCloseTo(last?.x ?? 0, 1)
  })

  it("never goes through the floor or the walls", () => {
    const fast = { ...launch, vx: 3, vy: 1 }
    for (const frame of simulateShard(fast, 3000, 8)) {
      expect(fast.center[1] + frame.y).toBeLessThanOrEqual(fast.floor)
      expect(fast.center[0] + frame.x).toBeLessThanOrEqual(fast.right)
    }
  })

  it("flies off freely without a floor or walls", () => {
    const free = { ...launch, floor: Infinity, left: -Infinity, right: Infinity, gravity: 0.001 }
    const last = simulateShard(free, 3000, 40).at(-1)
    expect(last?.x).toBeCloseTo(free.vx * 3000)
  })

  it("gives the same path for the same launch", () => {
    expect(simulateShard(launch, 2000, 40)).toEqual(simulateShard(launch, 2000, 40))
  })
})
