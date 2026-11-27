import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { specialCardsSampleQueryOptions } from "@/features/scout/api/players.queries"
import { SpecialCardsPage } from "@/features/scout/components/SpecialCardsPage"
import { SpecialCardsSkeleton } from "@/features/scout/components/SpecialCardsSkeleton"
import { specialCardsSearchSchema } from "@/features/scout/schemas/special-cards-search.schema"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/special-cards")({
  // Seçili takım kartı adreste durur: bağlantı doğrudan o takımın kartını açar.
  validateSearch: specialCardsSearchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(specialCardsSampleQueryOptions()),
  head: () => ({
    meta: pageMeta(m.meta_special_cards(), m.meta_special_cards_description()),
    links: hreflangLinks("/special-cards")
  }),
  pendingComponent: SpecialCardsSkeleton,
  component: SpecialCardsPage
})
