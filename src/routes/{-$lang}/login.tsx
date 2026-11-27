import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { pageMeta } from "@/config/seo.config"

import { hreflangLinks } from "@/helpers/localized-url"

import { LoginPage } from "@/features/scout/components/LoginPage"
import * as m from "@/paraglide/messages.js"

const searchSchema = z.object({
  error: z.enum(["failed"]).optional().catch(undefined)
})

export const Route = createFileRoute("/{-$lang}/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      ...pageMeta(m.meta_login(), m.meta_login_description(), "login"),
      { name: "robots", content: "noindex" }
    ],
    links: hreflangLinks("/login")
  }),
  component: LoginRoute
})

function LoginRoute() {
  const { error } = Route.useSearch()
  return <LoginPage failed={error === "failed"} />
}
