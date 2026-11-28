import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { topCountriesQueryOptions } from "@/features/scout/api/players.queries"
import { LeaderboardSkeleton } from "@/features/scout/components/LeaderboardSkeleton"
import { TopCountriesPage } from "@/features/scout/components/TopCountriesPage"
import { COUNTRY_PAGE_MIN } from "@/features/scout/constants/country-pages.constants"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/top/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(topCountriesQueryOptions()),
  head: () => ({
    meta: pageMeta(m.meta_top(), m.meta_top_description({ min: COUNTRY_PAGE_MIN }), "leaderboard"),
    links: hreflangLinks("/top")
  }),
  pendingComponent: LeaderboardSkeleton,
  component: TopCountriesPage
})
