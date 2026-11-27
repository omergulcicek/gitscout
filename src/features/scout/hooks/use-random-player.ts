import { useMutation } from "@tanstack/react-query"

import { getRandomPlayer } from "@/features/scout/api/players.functions"

/** Draws a random registered player on the server, never one of `exclude`. */
export function useRandomPlayer() {
  return useMutation({
    mutationFn: (exclude: string[]) => getRandomPlayer({ data: { exclude } })
  })
}
