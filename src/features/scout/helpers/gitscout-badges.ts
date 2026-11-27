import {
  FIRST_VERIFIED_LOGINS,
  MILESTONE_CARDS
} from "@/features/scout/constants/gitscout-badges.constants"
import type { Badge } from "@/features/scout/types/player.types"

/**
 * Badges Gitscout itself hands out, not read from GitHub: one of the first verified accounts and the
 * round-numbered cards. Added at read time, so they never touch the score summary.
 */
export function gitscoutBadges(login: string): Badge[] {
  const key = login.toLowerCase()
  const badges: Badge[] = []
  const verifiedIndex = FIRST_VERIFIED_LOGINS.findIndex((entry) => entry === key)
  if (verifiedIndex >= 0) {
    badges.push({
      id: "first-verified",
      values: { order: verifiedIndex + 1, total: FIRST_VERIFIED_LOGINS.length }
    })
  }
  const milestone = MILESTONE_CARDS[key]
  if (milestone) badges.push({ id: "milestone-card", values: { order: milestone } })
  return badges
}
