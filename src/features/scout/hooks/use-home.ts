import { useSuspenseQuery } from "@tanstack/react-query"

import { homeQueryOptions } from "@/features/scout/api/players.queries"

export function useHome() {
  return useSuspenseQuery(homeQueryOptions())
}
