import type { ListPlayer } from "@/features/scout/types/player.types"

/** How many similar developers a profile shows. */
export const SIMILAR_LIMIT = 4

/**
 * Developers in the same position whose overall score is closest to `player`'s, nearest first. Ties keep
 * the leaderboard order (higher OVR first), so the result is stable between requests.
 */
export function similarPlayers(
  player: { login: string; position: ListPlayer["position"]; ovrExact: number },
  players: readonly ListPlayer[],
  limit: number = SIMILAR_LIMIT
): ListPlayer[] {
  const self = player.login.toLowerCase()
  return players
    .map((candidate, index) => ({ candidate, index }))
    .filter(
      ({ candidate }) =>
        candidate.position === player.position && candidate.login.toLowerCase() !== self
    )
    .sort(
      (a, b) =>
        Math.abs(a.candidate.ovrExact - player.ovrExact) -
          Math.abs(b.candidate.ovrExact - player.ovrExact) || a.index - b.index
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
