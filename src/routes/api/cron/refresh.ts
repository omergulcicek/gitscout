import { createFileRoute } from "@tanstack/react-router"

import { isAuthorizedCron, refreshStalePlayers } from "@/features/scout/api/refresh-players.api"
import { freezeClosedSeasons } from "@/features/scout/api/season-freeze.api"
import { snapshotPlayers } from "@/features/scout/api/snapshot-players.api"
import { REFRESH } from "@/features/scout/constants/scoring.constants"
import { SEASON_YEAR } from "@/features/scout/helpers/season"

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
        // Freezing the closed season comes before the refresh, which overwrites the rolling calendar.
        const freezeStart = Date.now()
        const seasons = await freezeClosedSeasons(SEASON_YEAR)
        const freezeMs = Date.now() - freezeStart
        // Freezing spends part of the refresh's budget, so the whole run stays as long as before.
        const refresh = await refreshStalePlayers(Date.now, REFRESH.timeBudgetMs - freezeMs)
        return Response.json(
          { ...refresh, snapshot, seasons },
          {
            headers: { "Cache-Control": "no-store" }
          }
        )
      }
    }
  }
})
