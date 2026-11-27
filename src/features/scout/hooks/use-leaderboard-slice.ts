import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { leaderboardSliceQueryOptions } from "@/features/scout/api/players.queries"
import { useDebouncedValue } from "@/features/scout/hooks/use-debounced-value"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import { getLocale } from "@/paraglide/runtime.js"

/** Typing pauses this long before the search goes to the server. */
const SEARCH_DEBOUNCE_MS = 250

/**
 * The leaderboard page the URL asks for, filtered and sorted on the server. While the next page loads the
 * previous one stays on screen, so typing or sorting never flashes an empty table.
 */
export function useLeaderboardSlice() {
  const { search } = useLeaderboardSearch()
  const q = useDebouncedValue(search.q, SEARCH_DEBOUNCE_MS)
  const { pos, rarity, country, program, verified, sort, dir, limit } = search
  return useQuery({
    ...leaderboardSliceQueryOptions({
      q,
      pos,
      rarity,
      country,
      program,
      verified,
      sort,
      dir,
      limit,
      locale: getLocale()
    }),
    placeholderData: keepPreviousData
  })
}
