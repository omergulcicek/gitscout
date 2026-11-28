import { useSuspenseQuery } from "@tanstack/react-query"

import { countryTopQueryOptions } from "@/features/scout/api/players.queries"

export function useCountryTop(slug: string) {
  return useSuspenseQuery(countryTopQueryOptions(slug))
}
