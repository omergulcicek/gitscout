import { RARITY_THRESHOLDS } from "@/features/scout/constants/scoring.constants"
import type { Rarity } from "@/features/scout/types/player.types"

/** Time the rating takes to climb, plus a pause just under each tier line it crosses. */
export const REVEAL_CLIMB_MS = 900
export const REVEAL_STALL_MS = 200

type Segment = { from: number; to: number; ms: number }

/** The climb from 0 to the rating, cut at one under each tier line it reaches, with a pause after each cut. */
function segments(target: number): Segment[] {
  const stops = RARITY_THRESHOLDS.map((tier) => tier.min - 1)
    .filter((stop) => stop > 0 && stop < target)
    .sort((a, b) => a - b)
  const result: Segment[] = []
  let from = 0
  for (const stop of [...stops, target]) {
    result.push({ from, to: stop, ms: ((stop - from) / target) * REVEAL_CLIMB_MS })
    if (stop !== target) result.push({ from: stop, to: stop, ms: REVEAL_STALL_MS })
    from = stop
  }
  return result
}

/** How long the whole count takes for a rating. */
export function revealCountMs(target: number): number {
  return segments(target).reduce((total, segment) => total + segment.ms, 0)
}

/**
 * The rating shown `elapsed` ms into the count: each climb slows down as it nears the next tier line, waits
 * there a moment, then ticks over. Ends on the rating itself.
 */
export function revealCount(target: number, elapsed: number): number {
  if (target <= 0) return target
  let left = elapsed
  for (const segment of segments(target)) {
    if (left < segment.ms) {
      const t = left / segment.ms
      const eased = 1 - (1 - t) ** 3
      return Math.round(segment.from + (segment.to - segment.from) * eased)
    }
    left -= segment.ms
  }
  return target
}

/** The tier a rating falls in, never above the card's own tier (a frozen card keeps the tier it had). */
export function revealRarity(value: number, cap: Rarity): Rarity {
  const order = RARITY_THRESHOLDS.map((tier) => tier.rarity)
  const tier = RARITY_THRESHOLDS.find((item) => value >= item.min)?.rarity ?? "bronze"
  return order.indexOf(tier) < order.indexOf(cap) ? cap : tier
}
