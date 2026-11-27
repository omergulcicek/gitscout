import type { ListPlayer, Position, Rarity } from "@/features/scout/types/player.types"

export type CountrySummary = {
  total: number
  rarityCounts: Record<Rarity, number>
  /** The role most players hold; ties go to whichever comes first in the list. Null for an empty pool. */
  topPosition: Position | null
}

/** Headcount, card tiers and the most common role of one country's players, for the country page's intro. */
export function countrySummary(players: ListPlayer[]): CountrySummary {
  const rarityCounts: Record<Rarity, number> = { icon: 0, gold: 0, silver: 0, bronze: 0 }
  const positions = new Map<Position, number>()
  for (const player of players) {
    rarityCounts[player.rarity] += 1
    positions.set(player.position, (positions.get(player.position) ?? 0) + 1)
  }
  let topPosition: Position | null = null
  let topCount = 0
  for (const [position, count] of positions) {
    if (count > topCount) {
      topPosition = position
      topCount = count
    }
  }
  return { total: players.length, rarityCounts, topPosition }
}
