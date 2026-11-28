import type { StatTier } from "@/features/scout/constants/scoring.constants"

export const STAT_TIER_TEXT = {
  elite: "text-stat-elite",
  great: "text-stat-great",
  good: "text-stat-good",
  fair: "text-stat-fair",
  poor: "text-stat-poor"
} as const satisfies Record<StatTier, string>
