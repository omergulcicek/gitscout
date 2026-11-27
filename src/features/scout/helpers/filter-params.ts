import { COUNTRIES, UNKNOWN_COUNTRY } from "@/features/scout/constants/player-country.constants"
import type { CountryFilter } from "@/features/scout/constants/player-country.constants"
import {
  POSITION_SLUGS,
  POSITIONS,
  RARITIES
} from "@/features/scout/schemas/leaderboard-search.schema"
import type { Position, Rarity } from "@/features/scout/types/player.types"

const SEPARATOR = ","
const STAR_PROGRAM = "star"
const VERIFIED_ON = 1

const split = (value: string | undefined) =>
  (value ?? "")
    .split(SEPARATOR)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

/** `frontend,fullstack` → ["Frontend", "Full Stack"]; tanınmayan parçalar atlanır. */
export function parsePositions(value: string | undefined): Position[] {
  const slugs = split(value)
  return POSITIONS.filter((position) => slugs.includes(POSITION_SLUGS[position]))
}

export function parseRarities(value: string | undefined): Rarity[] {
  const slugs = split(value)
  return RARITIES.filter((rarity) => slugs.includes(rarity))
}

/** Boş liste URL'den kalksın diye undefined döner. */
export function serializePositions(positions: readonly Position[]): string | undefined {
  return positions.length > 0
    ? positions.map((position) => POSITION_SLUGS[position]).join(SEPARATOR)
    : undefined
}

export function serializeRarities(rarities: readonly Rarity[]): string | undefined {
  return rarities.length > 0 ? rarities.join(SEPARATOR) : undefined
}

/** `tr` → "TR", `unknown` → belirsizler; tanınmayan değer filtreyi kaldırır. */
export function parseCountry(value: string | undefined): CountryFilter | undefined {
  const slug = value?.trim().toLowerCase()
  if (slug === UNKNOWN_COUNTRY) return UNKNOWN_COUNTRY
  return COUNTRIES.find((country) => country.toLowerCase() === slug)
}

export function serializeCountry(country: CountryFilter | undefined): string | undefined {
  return country?.toLowerCase()
}

/** `?program=star` filtreyi açar; başka her değer kapalı sayılır. */
export function parseStar(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === STAR_PROGRAM
}

/** Kapalı filtre URL'den kalksın diye undefined döner. */
export function serializeStar(star: boolean): string | undefined {
  return star ? STAR_PROGRAM : undefined
}

/** `?verified=1` filtreyi açar; başka her değer kapalı sayılır. */
export function parseVerified(value: number | undefined): boolean {
  return value === VERIFIED_ON
}

/** Kapalı filtre URL'den kalksın diye undefined döner. */
export function serializeVerified(verified: boolean): typeof VERIFIED_ON | undefined {
  return verified ? VERIFIED_ON : undefined
}
