import { runWithLocale } from "@/lib/locale-scope"
import { OG_FONT_FAMILY, renderOgPng } from "@/lib/og-image"

import { loadAvatar, redirectTo } from "@/features/scout/api/og-image.api"
import { getBadgePlayer } from "@/features/scout/api/players.functions"
import { OgBadgeUnranked } from "@/features/scout/components/OgBadgeUnranked"
import { OgPlayerCard } from "@/features/scout/components/OgPlayerCard"
import { OgPlayerCardMedium } from "@/features/scout/components/OgPlayerCardMedium"
import { BADGE_CARD_SIZES, BADGE_SIGNATURE } from "@/features/scout/constants/badge.constants"
import { canonicalUrl } from "@/features/scout/helpers/canonical-url"
import type { BadgeCardSize, BadgeLocale } from "@/features/scout/schemas/badge.schema"
import { usernameSchema } from "@/features/scout/schemas/player.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"

/** README'de retina ekranda keskin dursun diye iki kat çizilir; Markdown `width` ile küçültür. */
const SCALE = 2

function CardFor({
  size,
  player,
  avatar
}: {
  size: BadgeCardSize
  player: ListPlayer
  avatar: string | null
}) {
  return (
    <div style={{ display: "flex", fontFamily: OG_FONT_FAMILY }}>
      {size === "medium" ? (
        <OgPlayerCardMedium player={player} avatar={avatar} />
      ) : (
        <OgPlayerCard player={player} avatar={avatar} signature={BADGE_SIGNATURE} />
      )}
    </div>
  )
}

/**
 * README'nin orta ve tam boy kart rozeti (PNG). Mini rozet gibi bilinmeyen ya da geçersiz adda da
 * 200 ve gri kart döner; GitHub görseli kendi proxy'sinde önbelleğe aldığından süre kısa tutulur.
 */
export async function playerBadgeCardResponse(
  username: string,
  url: URL,
  query: { size: BadgeCardSize | undefined; locale: BadgeLocale | undefined }
): Promise<Response> {
  const parsed = usernameSchema.safeParse(username)
  const entry = parsed.success ? await getBadgePlayer(parsed.data) : null
  // Same shape the README snippet writes: the stored login's casing, `size` if given, `lang` unless English.
  // Anything else (extra params, re-cased names) is redirected so it can't bypass the CDN cache.
  // An invalid name keeps its path; only valid logins are rewritten, so nothing odd lands in Location.
  const login = entry?.player.login ?? (parsed.success ? parsed.data.toLowerCase() : null)
  const canonical = canonicalUrl(
    url,
    { size: query.size, lang: query.locale === "en" ? undefined : query.locale },
    login ? `/badge/${login}.png` : url.pathname
  )
  if (canonical) return redirectTo(canonical)

  const size = query.size ?? "medium"
  const locale = query.locale ?? "en"
  const dimensions = BADGE_CARD_SIZES[size]

  const avatar = entry ? await loadAvatar(entry.player.avatarUrl) : null

  // Satori bileşenleri çizim sırasında çağırır: stat kısaltmaları ve unvan seçilen dilde yazılsın diye
  // çizimin tamamı o dilin kapsamında yapılır.
  const png = await runWithLocale(locale, () =>
    renderOgPng(
      entry ? (
        <CardFor size={size} player={entry.player} avatar={avatar} />
      ) : (
        <OgBadgeUnranked {...dimensions} />
      ),
      { ...dimensions, scale: SCALE }
    )
  )

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.byteLength),
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
    }
  })
}
