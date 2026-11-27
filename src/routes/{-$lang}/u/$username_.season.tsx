import { createFileRoute } from "@tanstack/react-router"

import { siteConfig } from "@/config/site.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { seasonQueryOptions } from "@/features/scout/api/players.queries"
import { PlayerDetailSkeleton } from "@/features/scout/components/PlayerDetailSkeleton"
import { SeasonPage } from "@/features/scout/components/SeasonPage"
import { SEASON_YEAR } from "@/features/scout/helpers/season"
import { seasonSearchSchema } from "@/features/scout/schemas/season-search.schema"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/u/$username_/season")({
  validateSearch: seasonSearchSchema,
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: ({ context, params, deps }) =>
    context.queryClient.ensureQueryData(seasonQueryOptions(params.username, deps.year)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.player.name ?? params.username
    const year = loaderData?.season.year ?? SEASON_YEAR
    const title = m.season_meta_title({ name, year })
    const prefix = params.lang ? `/${params.lang}` : ""
    const description = m.season_meta_description({ name, year })
    return {
      meta: [
        { title },
        { name: "description", content: description },
        // A draft until the season closes; kept out of search results.
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        {
          property: "og:url",
          content: `${siteConfig.url}${prefix}/u/${params.username}/season`
        }
      ],
      links: hreflangLinks(`/u/${params.username}/season`)
    }
  },
  pendingComponent: PlayerDetailSkeleton,
  component: SeasonRoute
})

function SeasonRoute() {
  const { username } = Route.useParams()
  const { year } = Route.useSearch()
  return <SeasonPage username={username} year={year} />
}
