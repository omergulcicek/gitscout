import { useSuspenseQuery } from "@tanstack/react-query"

import { specialCardsSampleQueryOptions } from "@/features/scout/api/players.queries"

export function useSpecialCardsSample() {
  return useSuspenseQuery(specialCardsSampleQueryOptions())
}
