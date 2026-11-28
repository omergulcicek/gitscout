import { createFileRoute } from "@tanstack/react-router"

import { localizedUrl } from "@/helpers/localized-url"

import { getSitemapPlayers } from "@/features/scout/api/player-store"
import { getCountryPageSlugs } from "@/features/scout/api/players.functions"
import { locales } from "@/paraglide/runtime.js"

const PATHS = ["/", "/leaderboard", "/top", "/vs", "/special-cards", "/about"]

type Entry = { path: string; lastmod: string; priority: string }

const toUrls = (entries: Entry[]) =>
  entries.flatMap((entry) =>
    locales.map(
      (locale) => `  <url>
    <loc>${localizedUrl(entry.path, locale)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <priority>${entry.priority}</priority>
  </url>`
    )
  )

/** Sabit sayfalar ve her oyuncunun profil sayfası; oyuncu sayfasının tarihi verinin çekildiği gündür. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString()
        const pages: Entry[] = PATHS.map((path) => ({
          path,
          lastmod: now,
          priority: path === "/" ? "1.0" : "0.5"
        }))
        const countries: Entry[] = (await getCountryPageSlugs()).map((slug) => ({
          path: `/top/${slug}`,
          lastmod: now,
          priority: "0.6"
        }))
        const players: Entry[] = (await getSitemapPlayers()).map((player) => ({
          path: `/u/${player.login}`,
          lastmod: player.fetchedAt.toISOString(),
          priority: "0.7"
        }))
        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${toUrls([...pages, ...countries, ...players]).join("\n")}
</urlset>
`

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600"
          }
        })
      }
    }
  }
})
