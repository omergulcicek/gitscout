import { createFileRoute } from "@tanstack/react-router"

import { siteConfig } from "@/config/site.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { seasonQueryOptions } from "@/features/scout/api/players.queries"
import { PlayerDetailSkeleton } from "@/features/scout/components/PlayerDetailSkeleton"
import { SeasonPage } from "@/features/scout/components/SeasonPage"
import { SEASON_YEAR } from "@/features/scout/helpers/season"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/u/$username_/season")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(seasonQueryOptions(params.username)),
  head: ({ params, loaderData }) => {
    const name = loaderData?.player.name ?? params.username
    const title = m.season_meta_title({ name, year: SEASON_YEAR })
    const prefix = params.lang ? `/${params.lang}` : ""
    const description = m.season_meta_description({ name, year: SEASON_YEAR })
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
  return <SeasonPage username={username} />
}
