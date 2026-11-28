import { createFileRoute, stripSearchParams } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { leaderboardSliceQueryOptions } from "@/features/scout/api/players.queries"
import { LeaderboardPage } from "@/features/scout/components/LeaderboardPage"
import { LeaderboardSkeleton } from "@/features/scout/components/LeaderboardSkeleton"
import {
  leaderboardPageSearchSchema,
  leaderboardSearchDefaults,
  leaderboardSearchSchema
} from "@/features/scout/schemas/leaderboard-search.schema"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

export const Route = createFileRoute("/{-$lang}/leaderboard")({
  validateSearch: leaderboardPageSearchSchema,
  search: { middlewares: [stripSearchParams(leaderboardSearchDefaults)] },
  // The search box is left out of the deps: typing is debounced in the page, not reloaded per keystroke.
  // A shared link with `?q=` still renders server-side because the loader reads it once from the URL.
  // `top` only switches between two lists the page already has, so it doesn't reload either.
  loaderDeps: ({ search: { q: _q, top: _top, ...rest } }) => rest,
  loader: ({ context, deps, location }) =>
    context.queryClient.ensureQueryData(
      leaderboardSliceQueryOptions({
        ...deps,
        q: leaderboardSearchSchema.parse(location.search).q,
        locale: getLocale()
      })
    ),
  head: () => ({
    meta: pageMeta(m.meta_leaderboard(), m.meta_leaderboard_description(), "leaderboard"),
    links: hreflangLinks("/leaderboard")
  }),
  pendingComponent: LeaderboardSkeleton,
  component: LeaderboardPage
})
