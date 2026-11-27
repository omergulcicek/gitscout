import { useSuspenseQuery } from "@tanstack/react-query"

import { topCountriesQueryOptions } from "@/features/scout/api/players.queries"

export function useTopCountries() {
  return useSuspenseQuery(topCountriesQueryOptions())
}
