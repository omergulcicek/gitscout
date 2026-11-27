import type { Season, SeasonStanding } from "@/features/scout/helpers/season"
import type { ListPlayer, ScoredPlayer } from "@/features/scout/types/player.types"

export type YearlyTotal = { year: number; total: number; reviews?: number }

/**
 * A closed season as stored in `gitscout.seasons`. Only raw figures are kept: the season's numbers are
 * computed again on read, so a formula fix reaches frozen seasons too. Rows are never updated.
 */
export type FrozenSeason = {
  /** Bumped when the stored shape changes; readers handle every version ever written. */
  format: 1
  login: string
  githubId: number
  year: number
  /** Daily contributions from 1 January, one entry per day of the year. */
  counts: number[]
  /** GitHub's own total and review count for the year. */
  total: number
  reviews: number
  /** Totals for every year since the account opened, as stored with the card when frozen. */
  yearly: YearlyTotal[]
  /**
   * The card as it stood at freezing time: rating, six stats, tier, position, title and country. Fields
   * added at read time (verified, special days, chosen card face) are left out.
   */
  card: ListPlayer
}

/** Everything the season page renders for one player. */
export type SeasonReport = {
  player: ScoredPlayer
  /** The card the season shows: the frozen one once the season closes, the live one until then. */
  card: ListPlayer
  season: Season
  /** True once the season is frozen; until then the numbers move with every refresh. */
  final: boolean
  /** Totals for every year since the account opened, oldest first; the career chart's bars. */
  career: YearlyTotal[]
  standing: SeasonStanding
  /** The closest same-position developer by overall score; the season's suggested duel. */
  rival: ListPlayer | null
}
