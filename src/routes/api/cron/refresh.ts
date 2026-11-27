import { createFileRoute } from "@tanstack/react-router"

import { isAuthorizedCron, refreshStalePlayers } from "@/features/scout/api/refresh-players.api"
import { snapshotPlayers } from "@/features/scout/api/snapshot-players.api"

/**
 * Vercel Cron saatte bir çağırır. Zamanı geldiyse puan ve sıra geçmişine yeni bir tur yazar, sonra verisi
 * bir haftadan eski birkaç kartı yeniler.
 */
export const Route = createFileRoute("/api/cron/refresh")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!isAuthorizedCron(request.headers.get("authorization"))) {
          return new Response("Unauthorized", { status: 401 })
        }
        // Geçmiş kaydı kısa sürer; yenilemenin süre bütçesini kullanmasın diye önce yazılır.
        const snapshot = await snapshotPlayers()
        const refresh = await refreshStalePlayers()
        return Response.json(
          { ...refresh, snapshot },
          {
            headers: { "Cache-Control": "no-store" }
          }
        )
      }
    }
  }
})
