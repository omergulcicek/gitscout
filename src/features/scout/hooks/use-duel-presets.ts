import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { duelPresetsQueryOptions } from "@/features/scout/api/players.queries"

/** Popular duel suggestions; `seed` undefined is this hour's set, which the route loader prefetches. */
export function useDuelPresets(seed?: number) {
  return useQuery({ ...duelPresetsQueryOptions(seed), placeholderData: keepPreviousData })
}
