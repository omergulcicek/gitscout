import { createFileRoute } from "@tanstack/react-router"

import { playerOgResponse } from "@/features/scout/api/og-image.api"

/** Oyuncu sayfasının link önizleme görseli (PNG). Dil, adresteki önekten gelir. */
export const Route = createFileRoute("/{-$lang}/og/$username")({
  server: {
    handlers: {
      GET: ({ params, request }) => playerOgResponse(params.username, new URL(request.url))
    }
  }
})
