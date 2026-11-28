import type { StatTier } from "@/features/scout/constants/scoring.constants"

export const STAT_TIER_TEXT = {
  elite: "text-stat-elite",
  great: "text-stat-great",
  good: "text-stat-good",
  fair: "text-stat-fair",
  poor: "text-stat-poor"
} as const satisfies Record<StatTier, string>

/**
 * How many of the five pips under a stat on the cards are filled. The tier reads from length rather than
 * hue, so it survives colour blindness and every card skin without per-skin colours.
 */
export const STAT_TIER_PIPS = {
  elite: 5,
  great: 4,
  good: 3,
  fair: 2,
  poor: 1
} as const satisfies Record<StatTier, number>

/** Pips under each stat on the cards. */
export const STAT_PIP_COUNT = 5
