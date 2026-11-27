/**
 * The canonical form of `url`: `pathname` (default: unchanged) plus only the given query parameters, in
 * the given order, with empty values dropped. Returns `null` when `url` already is canonical, so callers
 * redirect only when needed. Image routes use it so a random `?x=1` or a re-cased login can't create a
 * fresh CDN cache key and force a re-render.
 */
export function canonicalUrl(
  url: URL,
  params: Record<string, string | undefined>,
  pathname: string = url.pathname
): string | null {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value)
  }
  const query = search.toString()
  const canonical = `${pathname}${query ? `?${query}` : ""}`
  return canonical === `${url.pathname}${url.search}` ? null : canonical
}
