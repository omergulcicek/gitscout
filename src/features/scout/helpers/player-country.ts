import {
  COUNTRIES,
  PLAYER_COUNTRIES,
  UNKNOWN_COUNTRY
} from "@/features/scout/constants/player-country.constants"
import type {
  CountryCode,
  CountryFilter
} from "@/features/scout/constants/player-country.constants"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type CountryHolder = { login: string; country?: string | null; claimedCountry?: string | null }

/**
 * Oyuncunun ülkesi: önce onaylı sahibinin kendi seçtiği ülke, sonra elle atanmış liste (nereli olduğu),
 * yoksa GitHub konumundan çıkarılan ülke. Hiçbirinde yoksa `undefined`. GitHub kullanıcı adları büyük-küçük harf ayırmaz.
 */
export function playerCountry(player: CountryHolder): CountryCode | undefined {
  const claimed = COUNTRIES.find((country) => country === player.claimedCountry)
  if (claimed) return claimed
  const manual = PLAYER_COUNTRIES.get(player.login.toLowerCase())
  if (manual) return manual
  // Veritabanındaki özet doğrulanmadan okunur; tanınmayan değer bayrak yerine "belirsiz" olur.
  return COUNTRIES.find((country) => country === player.country)
}

/** Ülke filtresindeki karşılığı: ülkesi bilinmeyenler "belirsiz" sayılır. */
export function playerCountryFilter(player: CountryHolder): CountryFilter {
  return playerCountry(player) ?? UNKNOWN_COUNTRY
}

/** Uzun resmi adı menüyü taşıran ülkeler kısa adlarıyla yazılır ("Amerika Birleşik Devletleri" yerine "ABD"). */
const SHORT_NAMES: Partial<Record<CountryCode, () => string>> = {
  US: m.country_us
}

/** Ülke adı geçerli dilde, tarayıcının ve Node'un kendi ülke adları listesinden ("Almanya" / "Germany"). */
export function countryName(country: CountryCode): string {
  const short = SHORT_NAMES[country]
  if (short) return short()
  return new Intl.DisplayNames([getLocale()], { type: "region" }).of(country) ?? country
}

type CountryCount = { country: CountryCode; count: number }

/**
 * Tabloda bulunan ülkeler, en kalabalıktan aza; eşitlikte geçerli dile göre alfabe sırası.
 * Belirsizler ayrı sayılır, menüde en sonda durur.
 */
export function countPlayerCountries(players: readonly CountryHolder[]): {
  countries: CountryCount[]
  unknown: number
} {
  const counts = new Map<CountryCode, number>()
  let unknown = 0
  for (const player of players) {
    const country = playerCountry(player)
    if (country) counts.set(country, (counts.get(country) ?? 0) + 1)
    else unknown++
  }
  const countries = sortCountryCounts([...counts].map(([country, count]) => ({ country, count })))
  return { countries, unknown }
}

/**
 * Most players first, then by country name in the page language. Counts from the server are re-sorted in the
 * browser because the server doesn't know the reader's language.
 */
export function sortCountryCounts(countries: readonly CountryCount[]): CountryCount[] {
  const collator = new Intl.Collator(getLocale())
  return [...countries].sort(
    (a, b) => b.count - a.count || collator.compare(countryName(a.country), countryName(b.country))
  )
}
