/** GitHub's avatar CDN; it resizes on the fly with the `s` (pixel size) parameter. */
const GITHUB_AVATAR_HOST = "avatars.githubusercontent.com"

/**
 * A GitHub avatar URL sized for `px` CSS pixels at 2x density. Without `s` GitHub sends the full upload
 * (often 400–460 px, ~30 KB) even for a 24 px icon; `s=72` is ~2.5 KB. Other hosts are returned as is.
 */
export function avatarSrc(url: string, px: number): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== GITHUB_AVATAR_HOST) return url
    parsed.searchParams.set("s", String(Math.ceil(px * 2)))
    return parsed.toString()
  } catch {
    // Not an absolute URL (e.g. a test fixture or a data URI); leave it to the browser.
    return url
  }
}
