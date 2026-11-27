import { queryOptions } from "@tanstack/react-query"

import {
  getCountryTop,
  getDuelPresets,
  getHome,
  getLeaderboardSlice,
  getPlayer,
  getPlayersByLogin,
  getSpecialCardsSample,
  getTopCountries,
  searchPlayers
} from "@/features/scout/api/players.functions"
import { playerKeys } from "@/features/scout/api/query-keys"
import type { LeaderboardSearch } from "@/features/scout/schemas/leaderboard-search.schema"
import type { Locale } from "@/paraglide/runtime.js"

/** Oyuncu verisi bir kez çekilip değişmediği için istemci önbelleği bir gün taze sayılır. */
const DAY_MS = 24 * 60 * 60 * 1000

export const playerQueryOptions = (username: string) =>
  queryOptions({
    queryKey: playerKeys.detail(username),
    queryFn: ({ signal }) => getPlayer({ data: { username }, signal }),
    staleTime: DAY_MS
  })

export const homeQueryOptions = () =>
  queryOptions({
    queryKey: playerKeys.home(),
    queryFn: ({ signal }) => getHome({ signal }),
    // The featured card turns over every hour; shorter than the list's day so it isn't stuck.
    staleTime: 5 * 60 * 1000
  })

// Short like the home page: a country page opens as soon as its 25th developer arrives.
const COUNTRY_STALE_MS = 5 * 60 * 1000

export const topCountriesQueryOptions = () =>
  queryOptions({
    queryKey: playerKeys.countries(),
    queryFn: ({ signal }) => getTopCountries({ signal }),
    staleTime: COUNTRY_STALE_MS
  })

export const countryTopQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: playerKeys.country(slug),
    queryFn: ({ signal }) => getCountryTop({ data: { slug }, signal }),
    staleTime: COUNTRY_STALE_MS
  })

export type LeaderboardSliceParams = Pick<
  LeaderboardSearch,
  "q" | "pos" | "rarity" | "country" | "program" | "verified" | "sort" | "dir" | "limit"
> & { locale: Locale }

export const leaderboardSliceQueryOptions = (params: LeaderboardSliceParams) =>
  queryOptions({
    queryKey: playerKeys.board(params),
    queryFn: ({ signal }) => getLeaderboardSlice({ data: params, signal }),
    staleTime: DAY_MS
  })

export const playerSearchQueryOptions = (params: {
  q: string
  exclude: string[]
  locale: Locale
}) =>
  queryOptions({
    queryKey: playerKeys.search(params),
    queryFn: ({ signal }) => searchPlayers({ data: params, signal }),
    staleTime: DAY_MS
  })

export const playersByLoginQueryOptions = (logins: readonly string[]) =>
  queryOptions({
    queryKey: playerKeys.byLogin(logins),
    queryFn: ({ signal }) => getPlayersByLogin({ data: { logins: [...logins] }, signal }),
    staleTime: DAY_MS
  })

/** `seed` undefined means "this hour's pairs", which the server and the first render share. */
export const duelPresetsQueryOptions = (seed?: number) =>
  queryOptions({
    queryKey: playerKeys.presets(seed),
    queryFn: ({ signal }) => getDuelPresets({ data: { seed }, signal }),
    staleTime: DAY_MS
  })

export const specialCardsSampleQueryOptions = () =>
  queryOptions({
    queryKey: playerKeys.specialSample(),
    queryFn: ({ signal }) => getSpecialCardsSample({ signal }),
    staleTime: DAY_MS
  })
