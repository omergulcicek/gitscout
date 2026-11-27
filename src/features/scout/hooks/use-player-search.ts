import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { playerSearchQueryOptions } from "@/features/scout/api/players.queries"
import { useDebouncedValue } from "@/features/scout/hooks/use-debounced-value"
import { getLocale } from "@/paraglide/runtime.js"

/** Typing pauses this long before the search goes to the server. */
const SEARCH_DEBOUNCE_MS = 200

/** Server-side player search for pickers; earlier results stay while the next ones load. */
export function usePlayerSearch(query: string, exclude: readonly string[] = []) {
  const q = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  return useQuery({
    ...playerSearchQueryOptions({ q, exclude: [...exclude].sort(), locale: getLocale() }),
    placeholderData: keepPreviousData
  })
}
