import { createFileRoute } from "@tanstack/react-router"

import { countryOgResponse } from "@/features/scout/api/og-image.api"

/** A country page's link preview image (PNG). The language comes from the address prefix. */
export const Route = createFileRoute("/{-$lang}/og/top/$country")({
  server: {
    handlers: {
      GET: ({ params, request }) => countryOgResponse(params.country, new URL(request.url))
    }
  }
})
