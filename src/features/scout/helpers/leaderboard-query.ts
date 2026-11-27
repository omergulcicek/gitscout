import {
  parseCountry,
  parsePositions,
  parseRarities,
  parseStar,
  parseVerified
} from "@/features/scout/helpers/filter-params"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { countPlayerCountries, playerCountryFilter } from "@/features/scout/helpers/player-country"
import { matchesPlayer } from "@/features/scout/helpers/search-text"
import { POSITIONS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { LeaderboardSearch } from "@/features/scout/schemas/leaderboard-search.schema"
import type {
  LeaderboardFacets,
  LeaderboardSlice,
  ListPlayer,
  RankedPlayer,
  Rarity
} from "@/features/scout/types/player.types"
import type { Locale } from "@/paraglide/runtime.js"

type QueryParams = Pick<
  LeaderboardSearch,
  "q" | "pos" | "rarity" | "country" | "program" | "verified" | "sort" | "dir" | "limit"
>

/** Mirrors TanStack Table's basic comparator so server order matches what the table used to show. */
function compareBasic(a: string | number, b: string | number): number {
  return a === b ? 0 : a > b ? 1 : -1
}

function sortValue(player: ListPlayer, sort: QueryParams["sort"]): string | number {
  switch (sort) {
    case "ovr":
      return player.ovrExact
    // Same as TanStack's `text` sort function: lowercased string comparison.
    case "name":
      return player.name.toLowerCase()
    case "position":
      return player.position.toLowerCase()
    default:
      return player.stats[sort].value
  }
}

/**
 * Filters, ranks, searches, sorts and slices the leaderboard, in that order. The rank is the position inside
 * the filtered pool (sorted by OVR) and ignores search and column sorting, so a searched player keeps their
 * real rank. Ties keep the OVR order, like the table's stable sort did.
 */
export function queryLeaderboard(
  players: readonly ListPlayer[],
  params: QueryParams,
  locale: Locale
): LeaderboardSlice {
  const positions = parsePositions(params.pos)
  const rarities = parseRarities(params.rarity)
  const country = parseCountry(params.country)
  const star = parseStar(params.program)
  const verified = parseVerified(params.verified)

  const ranked: RankedPlayer[] = players
    .filter(
      (player) =>
        (positions.length === 0 || positions.includes(player.position)) &&
        (rarities.length === 0 || rarities.includes(player.rarity)) &&
        (country === undefined || playerCountryFilter(player) === country) &&
        (!star || isGithubStar(player.login)) &&
        (!verified || player.verified === true)
    )
    .map((player, index) => ({ ...player, rank: index + 1 }))

  const query = params.q ?? ""
  const matched = ranked.filter((player) => matchesPlayer(player, query, locale))
  const direction = params.dir === "desc" ? -1 : 1
  const sorted = matched
    .map((player, index) => ({ player, index, value: sortValue(player, params.sort) }))
    .sort((a, b) => direction * compareBasic(a.value, b.value) || a.index - b.index)
    .map((entry) => entry.player)

  return { players: sorted.slice(0, params.limit), matched: matched.length, total: players.length }
}

/** Filter options and summary counts, always taken from the whole list regardless of the active filters. */
export function leaderboardFacets(players: readonly ListPlayer[]): LeaderboardFacets {
  const count = (rarity: Rarity) => players.filter((player) => player.rarity === rarity).length
  const rarityCounts = {
    icon: count("icon"),
    gold: count("gold"),
    silver: count("silver"),
    bronze: count("bronze")
  } satisfies Record<Rarity, number>
  const { countries, unknown } = countPlayerCountries(players)
  return {
    total: players.length,
    rarityCounts,
    positions: POSITIONS.filter((position) =>
      players.some((player) => player.position === position)
    ),
    hasStars: players.some((player) => isGithubStar(player.login)),
    hasVerified: players.some((player) => player.verified === true),
    countries,
    unknownCountry: unknown
  }
}
