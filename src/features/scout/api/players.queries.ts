import { queryOptions } from "@tanstack/react-query"

import {
  getHome,
  getLeaderboard,
  getLeaderboardSlice,
  getPlayer
} from "@/features/scout/api/players.functions"
import { playerKeys } from "@/features/scout/api/query-keys"
import type { LeaderboardSearch } from "@/features/scout/schemas/leaderboard-search.schema"
import type { Locale } from "@/paraglide/runtime.js"

/** Oyuncu verisi bir kez çekilip değişmediği için istemci önbelleği bir gün taze sayılır. */
const DAY_MS = 24 * 60 * 60 * 1000

export const leaderboardQueryOptions = () =>
  queryOptions({
    queryKey: playerKeys.lists(),
    queryFn: ({ signal }) => getLeaderboard({ signal }),
    staleTime: DAY_MS
  })

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
