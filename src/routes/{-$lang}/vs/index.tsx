import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"
import { siteConfig } from "@/config/site.config"

import { hreflangLinks } from "@/helpers/localized-url"

import {
  duelPresetsQueryOptions,
  playersByLoginQueryOptions
} from "@/features/scout/api/players.queries"
import { DuelPicker } from "@/features/scout/components/DuelPicker"
import { DuelPickerSkeleton } from "@/features/scout/components/DuelPickerSkeleton"
import { duelSearchSchema } from "@/features/scout/schemas/duel-search.schema"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/vs/")({
  validateSearch: duelSearchSchema,
  loaderDeps: ({ search }) => ({ left: search.left }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(duelPresetsQueryOptions()),
      deps.left
        ? context.queryClient.ensureQueryData(playersByLoginQueryOptions([deps.left]))
        : undefined
    ]),
  head: ({ loaderData, match, params }) => {
    const links = hreflangLinks("/vs")
    // A challenge link previews as the challenger's own card, under an invitation title.
    const challenger = match.search.challenge === 1 ? loaderData?.[1]?.[0] : undefined
    if (!challenger)
      return { meta: pageMeta(m.meta_duel(), m.meta_duel_description(), "vs"), links }
    const prefix = params.lang ? `/${params.lang}` : ""
    const image = `${siteConfig.url}${prefix}/og/${challenger.login}?v=${Date.parse(challenger.fetchedAt)}`
    return {
      meta: [
        ...pageMeta(
          m.meta_challenge({ name: challenger.name }),
          m.meta_challenge_description({ name: challenger.name })
        ),
        { property: "og:image", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:image", content: image }
      ],
      links
    }
  },
  pendingComponent: DuelPickerSkeleton,
  component: DuelPicker
})
