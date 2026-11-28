import { createFileRoute } from "@tanstack/react-router"

import { ogImageMeta, pageMeta } from "@/config/seo.config"
import { siteConfig } from "@/config/site.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { countryTopQueryOptions } from "@/features/scout/api/players.queries"
import { CountryTopPage } from "@/features/scout/components/CountryTopPage"
import { LeaderboardSkeleton } from "@/features/scout/components/LeaderboardSkeleton"
import { countryName } from "@/features/scout/helpers/player-country"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/top/$country")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(countryTopQueryOptions(params.country)),
  head: ({ loaderData, params }) => {
    if (!loaderData) return {}
    const country = countryName(loaderData.country)
    // The image address carries the headcount, so a new developer means a fresh preview on every platform.
    const prefix = params.lang ? `/${params.lang}` : ""
    const image = ogImageMeta(
      `${siteConfig.url}${prefix}/og/top/${loaderData.slug}?v=${loaderData.total}`
    )
    if (!loaderData.unlocked) {
      // A page still waiting for its developers stays out of search results until it opens.
      return {
        meta: [
          ...pageMeta(
            m.meta_top_locked({ country }),
            m.top_locked_lead({ min: loaderData.min, count: loaderData.total })
          ),
          ...image,
          { name: "robots", content: "noindex" }
        ]
      }
    }
    const count = loaderData.players.length
    return {
      meta: [
        ...pageMeta(
          m.meta_top_country({ country, count }),
          m.meta_top_country_description({ country, count, total: loaderData.total })
        ),
        ...image
      ],
      links: hreflangLinks(`/top/${params.country}`)
    }
  },
  pendingComponent: LeaderboardSkeleton,
  component: CountryTopPage
})
