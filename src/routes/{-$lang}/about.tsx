import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { AboutPage } from "@/features/scout/components/AboutPage"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/about")({
  head: () => ({
    meta: pageMeta(m.meta_about(), m.meta_about_description(), "about"),
    links: hreflangLinks("/about")
  }),
  component: AboutPage
})
