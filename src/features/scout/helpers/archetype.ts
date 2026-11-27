import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import type { Archetype, Rarity, Stat, StatKey } from "@/features/scout/types/player.types"

/** Bu değerin altındaki stat tavsiye konusu olur; üstündekiler güçlü yan sayılır. */
const ARCHETYPE_WEAK_BELOW = 70

/** Scout notundaki madde sayısı. */
const NOTE_ITEMS = 3

/**
 * Kıdem yalnızca geçen zamanı ölçer; ne güçlü yan ne tavsiye olarak bir şey anlatır.
 * Bu yüzden iki listede de en sona kalır, başka seçenek yoksa yazılır.
 */
const LAST_RESORT: StatKey = "exp"

const lastResortLast = (keys: StatKey[]) => [
  ...keys.filter((key) => key !== LAST_RESORT),
  ...keys.filter((key) => key === LAST_RESORT)
]

/** Zayıf yanı olan oyuncuda gösterilecek en fazla güçlü yan; kalan yer tavsiyelere kalır. */
const MAX_STRENGTHS_WITH_GROWTH = 2

/**
 * Scout notu her zaman üç madde: zayıf yan yoksa en güçlü üç stat; varsa en fazla iki güçlü yan,
 * kalan yerler en zayıftan başlayan tavsiyeler. Puanı düşük oyuncu böylece üç tavsiye alır.
 */
export function computeArchetype(stats: Record<StatKey, Stat>, rarity: Rarity): Archetype {
  const ranked = [...STAT_ORDER].sort((a, b) => stats[b].raw - stats[a].raw)
  const strong = lastResortLast(ranked.filter((key) => stats[key].value >= ARCHETYPE_WEAK_BELOW))
  const weak = lastResortLast(
    ranked.filter((key) => stats[key].value < ARCHETYPE_WEAK_BELOW).reverse()
  )

  if (weak.length === 0) return { rarity, strengths: strong.slice(0, NOTE_ITEMS), growth: [] }

  const strengths = strong.slice(0, MAX_STRENGTHS_WITH_GROWTH)
  return { rarity, strengths, growth: weak.slice(0, NOTE_ITEMS - strengths.length) }
}
