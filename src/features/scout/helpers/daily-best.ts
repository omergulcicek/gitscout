import { POSITIONS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ListPlayer, Position } from "@/features/scout/types/player.types"

/** One role in the "today's best" strip; `player` is null when no card of that role was added. */
export type DailyBestSlot = { position: Position; player: ListPlayer | null }

/**
 * The highest-rated card of each role among `recentLogins` (cards added in the last 24 hours).
 * Every role gets a slot in a fixed order so the strip never shifts. Ties go to the exact score, then the login.
 */
export function dailyBest(players: ListPlayer[], recentLogins: Iterable<string>): DailyBestSlot[] {
  const recent = new Set(Array.from(recentLogins, (login) => login.toLowerCase()))
  const best = new Map<Position, ListPlayer>()
  for (const player of players) {
    if (!recent.has(player.login.toLowerCase())) continue
    const current = best.get(player.position)
    if (!current || isAhead(player, current)) best.set(player.position, player)
  }
  return POSITIONS.map((position) => ({ position, player: best.get(position) ?? null }))
}

function isAhead(a: ListPlayer, b: ListPlayer): boolean {
  if (a.ovrExact !== b.ovrExact) return a.ovrExact > b.ovrExact
  return a.login < b.login
}
