import { useSuspenseQuery } from "@tanstack/react-query"

import { seasonQueryOptions } from "@/features/scout/api/players.queries"

export function useSeason(username: string) {
  return useSuspenseQuery(seasonQueryOptions(username))
}
