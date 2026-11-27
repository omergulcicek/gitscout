import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { SeasonLanding } from "@/features/scout/components/SeasonLanding"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/season")({
  head: () => ({
    meta: pageMeta(m.season_landing_meta_title(), m.season_landing_meta_description()),
    links: hreflangLinks("/season")
  }),
  component: SeasonLanding
})
