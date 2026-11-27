import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { seededRandom } from "@/features/scout/helpers/seeded-random"
import type { ListPlayer } from "@/features/scout/types/player.types"

/** Vitrine yalnızca bu kart türleri çıkar; hiçbiri yoksa herkes aday olur. */
const FEATURED_RARITIES = new Set<ListPlayer["rarity"]>(["icon", "gold"])

/** Son 24 saatte eklenen bir kartın seçilme ağırlığı; diğerleri 1. */
const RECENT_WEIGHT = 3

/**
 * Showcase order: Gold and above cards in a seeded, weighted shuffle.
 * The same seed gives the same order everywhere, so server and browser show the same card.
 * The first entry is the "card of the hour"; "Another card" walks through the rest.
 * With `country`, only that country's cards are candidates; if it has none, the global pool is used.
 */
export function featuredOrder(
  players: ListPlayer[],
  recentLogins: ReadonlySet<string>,
  seed: number,
  country?: CountryCode
): ListPlayer[] {
  const elite = players.filter((player) => FEATURED_RARITIES.has(player.rarity))
  const ranked = elite.length > 0 ? elite : players
  const local = country ? ranked.filter((player) => playerCountry(player) === country) : []
  const pool = local.length > 0 ? local : ranked
  const random = seededRandom(seed)
  // Efraimidis-Spirakis: her öğeye u^(1/ağırlık) anahtarı verip büyükten küçüğe dizmek ağırlıklı karıştırmadır.
  return pool
    .map((player) => {
      const weight = recentLogins.has(player.login) ? RECENT_WEIGHT : 1
      return { player, key: random() ** (1 / weight) }
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.player)
}
