import { createFileRoute } from "@tanstack/react-router"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { SettingsPage } from "@/features/scout/components/SettingsPage"
import * as m from "@/paraglide/messages.js"

export const Route = createFileRoute("/{-$lang}/settings")({
  head: () => ({
    meta: [
      ...pageMeta(m.meta_settings(), m.meta_settings_description(), "settings"),
      { name: "robots", content: "noindex" }
    ],
    links: hreflangLinks("/settings")
  }),
  component: SettingsPage
})
