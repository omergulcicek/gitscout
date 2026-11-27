/**
 * The first verified accounts, in the order they were verified. A closed list: it never changes, even if
 * someone drops their verification later, so the badge stays with whoever earned it.
 */
export const FIRST_VERIFIED_LOGINS = [
  "omergulcicek",
  "ozankonuskan",
  "enderahmetyurt",
  "emircobanofficial",
  "mustafamasa",
  "ferdikocaa",
  "muhammedeminalan",
  "alicolak64",
  "ahmens",
  "u230709007"
] as const

/**
 * Round-numbered cards by the order they were added to Gitscout. Fixed by hand so a deleted card can't
 * shift the numbers; add a row when the next milestone is reached.
 */
export const MILESTONE_CARDS: Record<string, number> = {
  cemrehancavdar: 100,
  aliyilmazco: 250,
  julianaconde: 500,
  yisoga: 1000
}
