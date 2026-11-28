/**
 * Character budgets for a name on each card size. The cards use a monospace font, so a character count
 * stands in for the width: two lines on the full card, one on the medium card, a short one on the mini card.
 */
export const CARD_NAME_BUDGET = {
  full: 32,
  medium: 18,
  mini: 12
} as const

export type CardNameSize = keyof typeof CARD_NAME_BUDGET

/** A word made only of letters (and inner apostrophes or hyphens) can be shortened to its initial. */
const WORD = /^\p{L}[\p{L}'’-]*$/u

/**
 * Fits a display name into a card's budget without losing the surname: middle names become initials
 * first ("Kamila d. f. s. Oliveira"), then drop ("Kamila Oliveira"), and only then the end is cut with an
 * ellipsis. Names with symbols or separators ("Adrian Hajdin - JS Mastery") skip straight to the cut,
 * since shortening their parts would change what they say.
 */
export function fitCardName(name: string, size: CardNameSize): string {
  const budget = CARD_NAME_BUDGET[size]
  const clean = name.trim().replace(/\s+/g, " ")
  if (clean.length <= budget) return clean

  const words = clean.split(" ")
  const first = words[0]
  const last = words.at(-1)
  if (first && last && words.length >= 3 && words.every((word) => WORD.test(word))) {
    const initials = words.slice(1, -1).map((word) => `${word.charAt(0)}.`)
    const shortened = [first, ...initials, last].join(" ")
    if (shortened.length <= budget) return shortened
    const firstAndLast = `${first} ${last}`
    if (firstAndLast.length <= budget) return firstAndLast
  }

  // A cut that lands right after a separator ("Serdar Dogruyol -…") drops it too.
  return `${clean.slice(0, budget - 1).replace(/[\s\-–—|·•,:;/]+$/, "")}…`
}

/**
 * Characters the server-drawn images can render: the embedded font only covers Latin and Latin Extended,
 * so anything else (CJK, emoji, other scripts) would draw as empty boxes.
 */
const DRAWABLE = /[\u0020-\u024F\u1E00-\u1EFF\u2010-\u2027\u2030-\u205E]/u

/**
 * A name for the server-drawn images: characters the font cannot draw are removed, along with the
 * separators they leave dangling ("Serdar Dogruyol - Sedo セド" → "Serdar Dogruyol - Sedo"). When no
 * letters are left, the GitHub username stands in.
 */
export function drawableName(name: string, login: string): string {
  const kept = [...name]
    .filter((char) => DRAWABLE.test(char))
    .join("")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—|·•,:;/]+|[\s\-–—|·•,:;/]+$/g, "")
  return /\p{L}/u.test(kept) ? kept : `@${login}`
}

/** Text other than a name (club, title) with the undrawable characters removed; may come back empty. */
export function drawableText(text: string): string {
  return [...text]
    .filter((char) => DRAWABLE.test(char))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
}
