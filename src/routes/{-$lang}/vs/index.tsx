import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

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
  head: () => ({
    meta: pageMeta(m.meta_duel(), m.meta_duel_description(), "vs"),
    links: hreflangLinks("/vs")
  }),
  pendingComponent: DuelPickerSkeleton,
  component: DuelPicker
})
