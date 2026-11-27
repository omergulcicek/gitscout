import type { Season, SeasonStanding } from "@/features/scout/helpers/season"
import type { ListPlayer, ScoredPlayer } from "@/features/scout/types/player.types"

/** Everything the season page renders for one player. */
export type SeasonReport = {
  player: ScoredPlayer
  season: Season
  standing: SeasonStanding
  /** The closest same-position developer by overall score; the season's suggested duel. */
  rival: ListPlayer | null
}
