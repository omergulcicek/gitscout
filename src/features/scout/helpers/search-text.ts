import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

/** Aksanları ve noktasız ı'yı düzler: "omer" yazınca "Ömer", "gurlu" yazınca "GÜRLÜ" bulunsun. */
function normalizeSearch(text: string, locale: Locale): string {
  return text
    .toLocaleLowerCase(locale)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ı/g, "i")
    .trim()
}

/** Oyuncu adında ya da kullanıcı adında geçiyor mu; baştaki @ yok sayılır. */
// `locale` is passed explicitly on the server, where there is no page locale to read.
export function matchesPlayer(
  player: { name: string; login: string },
  query: string,
  locale: Locale = getLocale()
): boolean {
  const q = normalizeSearch(query.replace(/^@/, ""), locale)
  return (
    q === "" ||
    normalizeSearch(player.name, locale).includes(q) ||
    normalizeSearch(player.login, locale).includes(q)
  )
}

/** Metinde aranan ifade geçiyor mu; aksanlar ve büyük-küçük harf yok sayılır. */
export function matchesText(text: string, query: string): boolean {
  const locale = getLocale()
  const q = normalizeSearch(query, locale)
  return q === "" || normalizeSearch(text, locale).includes(q)
}
