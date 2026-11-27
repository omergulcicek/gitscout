import { COUNTRIES } from "@/features/scout/constants/player-country.constants"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import type { ListPlayer } from "@/features/scout/types/player.types"

const englishNames = new Intl.DisplayNames(["en"], { type: "region" })

/**
 * The country's URL segment, from its English name: "Türkiye" → `turkiye`, "United States" → `united-states`.
 * Built on the server only, so a browser with other country names can't produce a different link.
 */
export function countrySlug(country: CountryCode): string {
  return (englishNames.of(country) ?? country)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function countryFromSlug(slug: string): CountryCode | undefined {
  const key = slug.toLowerCase()
  return COUNTRIES.find((country) => countrySlug(country) === key)
}

/** Players grouped by country, each group in leaderboard order; players without a country are left out. */
export function playersByCountry(players: ListPlayer[]): Map<CountryCode, ListPlayer[]> {
  const groups = new Map<CountryCode, ListPlayer[]>()
  for (const player of players) {
    const country = playerCountry(player)
    if (!country) continue
    const group = groups.get(country)
    if (group) group.push(player)
    else groups.set(country, [player])
  }
  return groups
}
