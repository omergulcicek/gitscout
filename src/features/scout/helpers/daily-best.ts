import type { ListPlayer, Position } from "@/features/scout/types/player.types"

/**
 * The highest-rated card of each role among `recentLogins` (cards added in the last 24 hours), best first.
 * Roles with no new card that day are left out. Ties go to the exact score, then the login.
 */
export function dailyBest(players: ListPlayer[], recentLogins: Iterable<string>): ListPlayer[] {
  const recent = new Set(Array.from(recentLogins, (login) => login.toLowerCase()))
  const best = new Map<Position, ListPlayer>()
  for (const player of players) {
    if (!recent.has(player.login.toLowerCase())) continue
    const current = best.get(player.position)
    if (!current || isAhead(player, current)) best.set(player.position, player)
  }
  return [...best.values()].sort((a, b) => (isAhead(a, b) ? -1 : 1))
}

function isAhead(a: ListPlayer, b: ListPlayer): boolean {
  if (a.ovrExact !== b.ovrExact) return a.ovrExact > b.ovrExact
  return a.login < b.login
}
