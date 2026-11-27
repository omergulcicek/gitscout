import { useNavigate, useSearch } from "@tanstack/react-router"

import type { CountryFilter } from "@/features/scout/constants/player-country.constants"
import {
  parseCountry,
  parsePositions,
  parseRarities,
  parseStar,
  parseVerified,
  serializeCountry,
  serializePositions,
  serializeRarities,
  serializeStar,
  serializeVerified
} from "@/features/scout/helpers/filter-params"
import { leaderboardSearchSchema } from "@/features/scout/schemas/leaderboard-search.schema"
import type { LeaderboardSearch } from "@/features/scout/schemas/leaderboard-search.schema"
import type { Position, Rarity } from "@/features/scout/types/player.types"

type Filters = {
  positions: Position[]
  rarities: Rarity[]
  country: CountryFilter | undefined
  star: boolean
  verified: boolean
}

/**
 * Tablonun sıralama ve filtre durumu; hangi sayfada olduğunu bilmeden URL'den okur ve yazar.
 * Ana sayfa ve liderlik sayfası aynı tabloyu kullanır.
 */
export function useLeaderboardSearch() {
  const search = leaderboardSearchSchema.parse(useSearch({ strict: false }))
  const navigate = useNavigate()
  const filters: Filters = {
    positions: parsePositions(search.pos),
    rarities: parseRarities(search.rarity),
    country: parseCountry(search.country),
    star: parseStar(search.program),
    verified: parseVerified(search.verified)
  }

  const update = (patch: Partial<LeaderboardSearch>) => {
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
      resetScroll: false
    })
  }

  const setFilters = (next: Partial<Filters>) => {
    update({
      pos: serializePositions(next.positions ?? filters.positions),
      rarity: serializeRarities(next.rarities ?? filters.rarities),
      country: serializeCountry("country" in next ? next.country : filters.country),
      program: serializeStar(next.star ?? filters.star),
      verified: serializeVerified(next.verified ?? filters.verified)
    })
  }

  return { search, filters, update, setFilters }
}
