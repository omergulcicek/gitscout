import { useSuspenseQuery } from "@tanstack/react-query"

import { turkeyTopQueryOptions } from "@/features/scout/api/players.queries"

export function useTurkeyTop() {
  return useSuspenseQuery(turkeyTopQueryOptions())
}
