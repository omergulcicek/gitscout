import { createFileRoute, stripSearchParams } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { homeQueryOptions } from "@/features/scout/api/players.queries"
import { HomeSkeleton } from "@/features/scout/components/HomeSkeleton"
import { ScoutHome } from "@/features/scout/components/ScoutHome"
import {
  homeSearchSchema,
  leaderboardSearchDefaults
} from "@/features/scout/schemas/leaderboard-search.schema"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/")({
  validateSearch: homeSearchSchema,
  search: { middlewares: [stripSearchParams(leaderboardSearchDefaults)] },
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQueryOptions()),
  head: () => ({ meta: pageMeta(m.meta_home()), links: hreflangLinks("/") }),
  pendingComponent: HomeSkeleton,
  component: ScoutHome
})
