import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { turkeyTopQueryOptions } from "@/features/scout/api/players.queries"
import { LeaderboardSkeleton } from "@/features/scout/components/LeaderboardSkeleton"
import { TopTurkeyPage } from "@/features/scout/components/TopTurkeyPage"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/top/turkey")({
  loader: ({ context }) => context.queryClient.ensureQueryData(turkeyTopQueryOptions()),
  head: ({ loaderData }) => ({
    meta: pageMeta(
      m.meta_top_turkey(),
      m.meta_top_turkey_description({ count: loaderData?.total ?? 0 }),
      "leaderboard"
    ),
    links: hreflangLinks("/top/turkey")
  }),
  pendingComponent: LeaderboardSkeleton,
  component: TopTurkeyPage
})
