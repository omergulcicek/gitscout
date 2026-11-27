import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { siteConfig } from "@/config/site.config"

import { getLangParam, hreflangLinks } from "@/helpers/localized-url"

import { LostCard } from "@/components/shared/LostCard"
import { playerQueryOptions } from "@/features/scout/api/players.queries"
import { AddPlayerForm } from "@/features/scout/components/AddPlayerForm"
import { PlayerDetail } from "@/features/scout/components/PlayerDetail"
import { PlayerDetailSkeleton } from "@/features/scout/components/PlayerDetailSkeleton"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/u/$username")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(playerQueryOptions(params.username)),
  head: ({ params, loaderData }) => {
    const title = loaderData ? `${loaderData.name} · Gitscout` : `${params.username} · Gitscout`
    if (!loaderData) return { meta: [{ title }], links: hreflangLinks(`/u/${params.username}`) }

    // Görsel adresi kartın yenilenme tarihini taşır: kart yenilenince platformlar yeni görseli çeker.
    const prefix = params.lang ? `/${params.lang}` : ""
    const version = Date.parse(loaderData.fetchedAt)
    const image = `${siteConfig.url}${prefix}/og/${loaderData.login}?v=${version}`
    const description = m.og_description({ name: loaderData.name, ovr: loaderData.ovr })
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `${siteConfig.url}${prefix}/u/${loaderData.login}` },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image }
      ],
      links: hreflangLinks(`/u/${params.username}`)
    }
  },
  pendingComponent: PlayerDetailSkeleton,
  notFoundComponent: PlayerNotFound,
  component: PlayerPage
})

function PlayerPage() {
  const { username } = Route.useParams()
  return <PlayerDetail username={username} />
}

function PlayerNotFound() {
  const { username } = Route.useParams()
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-4 py-16 outline-none sm:px-6 md:grid-cols-[auto_1fr] md:gap-16 md:py-24"
    >
      <meta name="robots" content="noindex" />
      <div className="flex justify-center">
        <LostCard name={`@${username}`} subtitle={m.lost_card_player_subtitle()} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <p className="font-mono text-sm font-semibold tracking-widest text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance break-words md:text-4xl">
          {m.player_not_found_title({ username })}
        </h1>
        <p className="max-w-lg font-mono text-sm leading-relaxed text-muted-foreground">
          {m.player_not_found_description()}
        </p>
        <div className="mt-2 w-full max-w-xl">
          <AddPlayerForm defaultUsername={username} variant="command" />
        </div>
        <Link
          to="/{-$lang}/leaderboard"
          params={{ lang: getLangParam() }}
          className="mt-2 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {m.leaderboard_title()}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </main>
  )
}
