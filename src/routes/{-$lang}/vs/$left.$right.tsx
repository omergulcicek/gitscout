import { createFileRoute, Link } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"
import { siteConfig } from "@/config/site.config"

import { getLangParam, hreflangLinks } from "@/helpers/localized-url"

import { buttonVariants } from "@/components/ui/button"
import { playerQueryOptions } from "@/features/scout/api/players.queries"
import { DuelSkeleton } from "@/features/scout/components/DuelSkeleton"
import { DuelView } from "@/features/scout/components/DuelView"
import { ogVersion } from "@/features/scout/helpers/og-version"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/vs/$left/$right")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(playerQueryOptions(params.left)),
      context.queryClient.ensureQueryData(playerQueryOptions(params.right))
    ]),
  head: ({ params, loaderData }) => {
    const meta = pageMeta(
      m.meta_duel_pair({ left: params.left, right: params.right }),
      m.meta_duel_pair_description({ left: params.left, right: params.right })
    )
    const links = hreflangLinks(`/vs/${params.left}/${params.right}`)
    if (!loaderData) return { meta, links }

    // Görsel adresi iki kartın en son yenilenme tarihini taşır: biri yenilenince platformlar yeni görseli çeker.
    const [left, right] = loaderData
    const prefix = params.lang ? `/${params.lang}` : ""
    const version = ogVersion(Date.parse(left.fetchedAt), Date.parse(right.fetchedAt))
    const path = `${left.login}/${right.login}`
    const image = `${siteConfig.url}${prefix}/og/vs/${path}?v=${version}`
    return {
      meta: [
        ...meta,
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${siteConfig.url}${prefix}/vs/${path}` },
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image }
      ],
      links
    }
  },
  pendingComponent: DuelSkeleton,
  notFoundComponent: DuelNotFound,
  component: DuelPage
})

function DuelPage() {
  const { left, right } = Route.useParams()
  return <DuelView left={left} right={right} />
}

function DuelNotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-4 px-6 py-24 text-center outline-none"
    >
      <meta name="robots" content="noindex" />
      <h1 className="text-3xl font-bold">{m.duel_not_found_title()}</h1>
      <p className="font-mono text-muted-foreground">{m.duel_not_found_description()}</p>
      <Link to="/{-$lang}/vs" params={{ lang: getLangParam() }} className={buttonVariants()}>
        {m.duel_pick_players()}
      </Link>
    </main>
  )
}
