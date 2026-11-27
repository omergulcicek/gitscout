import { redirectTo } from "@/features/scout/api/og-image.api"
import { getBadgePlayer } from "@/features/scout/api/players.functions"
import { canonicalUrl } from "@/features/scout/helpers/canonical-url"
import { playerBadgeSvg, unrankedBadgeSvg } from "@/features/scout/helpers/player-badge"
import type { BadgeLocale } from "@/features/scout/schemas/badge.schema"
import { usernameSchema } from "@/features/scout/schemas/player.schema"

/**
 * Kullanıcı adı README'lerde yıllarca kalacağı için bilinmeyen ya da geçersiz adda da 200 ve
 * "sırada değil" rozeti döner; 404 GitHub'da kırık görsel olarak görünürdü.
 */
/** README rozeti. GitHub görseli kendi proxy'sinde önbelleğe aldığından süre kısa tutulur. */
export async function playerBadgeResponse(
  username: string,
  url: URL,
  requestedLocale: BadgeLocale | undefined
): Promise<Response> {
  const parsed = usernameSchema.safeParse(username)
  const entry = parsed.success ? await getBadgePlayer(parsed.data) : null
  // Only the stored login and a non-English `lang` make a cacheable URL; see the PNG badge.
  // An invalid name keeps its path; only valid logins are rewritten, so nothing odd lands in Location.
  const login = entry?.player.login ?? (parsed.success ? parsed.data.toLowerCase() : null)
  const canonical = canonicalUrl(
    url,
    { lang: requestedLocale === "en" ? undefined : requestedLocale },
    login ? `/badge/${login}.svg` : url.pathname
  )
  if (canonical) return redirectTo(canonical)

  const locale = requestedLocale ?? "en"
  const svg = entry ? playerBadgeSvg({ ...entry.player, locale }) : unrankedBadgeSvg(locale)
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
    }
  })
}
