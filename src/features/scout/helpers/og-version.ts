/**
 * Bumped whenever the cards or the link previews are redrawn. Preview images are cached by their
 * address for days (on the CDN and by X, LinkedIn and others), so a new design needs a new address.
 */
export const OG_DESIGN_VERSION = 2

/**
 * The `v` value of a preview image's address: the design version, then what changes the picture
 * (a card's refresh time, or a country's headcount). Pages and image routes build it the same way.
 */
export function ogVersion(...stamps: number[]): string {
  return `${OG_DESIGN_VERSION}.${Math.max(...stamps)}`
}
