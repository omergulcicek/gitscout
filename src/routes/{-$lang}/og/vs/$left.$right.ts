import { createFileRoute } from "@tanstack/react-router"

import { duelOgResponse } from "@/features/scout/api/og-image.api"

/** Düello sayfasının link önizleme görseli (PNG). Dil, adresteki önekten gelir. */
export const Route = createFileRoute("/{-$lang}/og/vs/$left/$right")({
  server: {
    handlers: {
      GET: ({ params, request }) => duelOgResponse(params.left, params.right, new URL(request.url))
    }
  }
})
