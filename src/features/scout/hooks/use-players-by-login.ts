import { useQuery } from "@tanstack/react-query"

import { playersByLoginQueryOptions } from "@/features/scout/api/players.queries"

/** List data for specific players, in the given order; nothing is fetched for an empty list. */
export function usePlayersByLogin(logins: readonly string[]) {
  return useQuery({ ...playersByLoginQueryOptions(logins), enabled: logins.length > 0 })
}
