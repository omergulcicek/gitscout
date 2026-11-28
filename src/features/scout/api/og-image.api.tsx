import { OG_SIZE, renderOgPng } from "@/lib/og-image"

import { getScoredPlayer } from "@/features/scout/api/player-store"
import { findCountryTop } from "@/features/scout/api/players.functions"
import {
  OG_COUNTRY_FACES,
  ogCountryAvatarSize,
  OgCountryImage
} from "@/features/scout/components/OgCountryImage"
import { OgDuelImage } from "@/features/scout/components/OgDuelImage"
import { OgImage } from "@/features/scout/components/OgImage"
import { canonicalUrl } from "@/features/scout/helpers/canonical-url"
import { ogVersion } from "@/features/scout/helpers/og-version"
import { usernameSchema } from "@/features/scout/schemas/player.schema"

/** A 280px avatar is ~30 KB; anything far bigger isn't an avatar and would bloat the render. */
const MAX_AVATAR_BYTES = 1024 * 1024

/** Avatar küçük boyutta çekilip görsele gömülür; alınamazsa yer tutucu çizilir. */
export async function loadAvatar(avatarUrl: string, size = 280): Promise<string | null> {
  try {
    const url = new URL(avatarUrl)
    url.searchParams.set("s", String(size))
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return null
    if (Number(response.headers.get("content-length") ?? 0) > MAX_AVATAR_BYTES) return null
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > MAX_AVATAR_BYTES) return null
    const type = response.headers.get("content-type") ?? "image/png"
    const data = Buffer.from(bytes).toString("base64")
    return `data:${type};base64,${data}`
  } catch (error) {
    console.error("[og] avatar alınamadı", error instanceof Error ? error.message : error)
    return null
  }
}

/** PNG yanıtı. Adres kartların yenilenme tarihini (`v`) taşıdığı için uzun süre önbellekte tutulabilir. */
function pngResponse(png: Uint8Array): Response {
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Image-Size": `${OG_SIZE.width}x${OG_SIZE.height}`
    }
  })
}

/** Misses are cached briefly too, so probing unknown names doesn't hit the database every time. */
function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" }
  })
}

/**
 * Sends any other query string to the one URL that is rendered and cached: the card's current version
 * and nothing else. Without this, `?v=random` or `?x=1` would skip the CDN and re-render every time.
 * The redirect itself is cheap (no render) and cached for a while.
 */
export function redirectTo(location: string): Response {
  return new Response(null, {
    status: 308,
    headers: { Location: location, "Cache-Control": "public, max-age=3600, s-maxage=3600" }
  })
}

/** `url`'s path with its last `count` segments replaced by the stored logins (their real casing). */
function withLogins(url: URL, logins: string[]): string {
  const segments = url.pathname.split("/")
  return [...segments.slice(0, segments.length - logins.length), ...logins].join("/")
}

/**
 * Oyuncunun link önizleme görseli. Adres kartın yenilenme tarihini (`v`) taşıdığı için uzun süre
 * önbellekte tutulabilir; kart yenilenince adres değişir ve platformlar yeni görseli çeker.
 */
export async function playerOgResponse(username: string, url: URL): Promise<Response> {
  const parsed = usernameSchema.safeParse(username)
  if (!parsed.success) return notFound()
  const player = await getScoredPlayer(parsed.data)
  if (!player) return notFound()
  const canonical = canonicalUrl(
    url,
    { v: ogVersion(Date.parse(player.fetchedAt)) },
    withLogins(url, [player.login])
  )
  if (canonical) return redirectTo(canonical)

  const png = await renderOgPng(
    <OgImage player={player} avatar={await loadAvatar(player.avatarUrl)} />
  )
  return pngResponse(png)
}

/** Düello sayfasının link önizleme görseli; oyunculardan biri yoksa 404 döner. */
export async function duelOgResponse(
  leftName: string,
  rightName: string,
  url: URL
): Promise<Response> {
  const leftLogin = usernameSchema.safeParse(leftName)
  const rightLogin = usernameSchema.safeParse(rightName)
  if (!leftLogin.success || !rightLogin.success) return notFound()
  const [left, right] = await Promise.all([
    getScoredPlayer(leftLogin.data),
    getScoredPlayer(rightLogin.data)
  ])
  if (!left || !right) return notFound()
  // Same version as the duel page's og:image: the newer of the two cards.
  const canonical = canonicalUrl(
    url,
    { v: ogVersion(Date.parse(left.fetchedAt), Date.parse(right.fetchedAt)) },
    withLogins(url, [left.login, right.login])
  )
  if (canonical) return redirectTo(canonical)

  const [leftAvatar, rightAvatar] = await Promise.all([
    loadAvatar(left.avatarUrl),
    loadAvatar(right.avatarUrl)
  ])
  const png = await renderOgPng(
    <OgDuelImage left={left} right={right} leftAvatar={leftAvatar} rightAvatar={rightAvatar} />
  )
  return pngResponse(png)
}

/**
 * A country page's link preview. The address carries the country's headcount (`v`): a new developer
 * changes the picture, so platforms fetch the new image.
 */
export async function countryOgResponse(slug: string, url: URL): Promise<Response> {
  const top = await findCountryTop(slug)
  if (!top) return notFound()
  const segments = url.pathname.split("/")
  const path = [...segments.slice(0, -1), top.slug].join("/")
  const canonical = canonicalUrl(url, { v: ogVersion(top.total) }, path)
  if (canonical) return redirectTo(canonical)

  const shown = top.players.slice(0, OG_COUNTRY_FACES)
  // Small faces are fetched small: sixty full-size avatars would slow the render for nothing.
  const avatars = await Promise.all(
    shown.map((player, index) => loadAvatar(player.avatarUrl, ogCountryAvatarSize(index)))
  )
  const png = await renderOgPng(<OgCountryImage top={top} avatars={avatars} />)
  return pngResponse(png)
}
