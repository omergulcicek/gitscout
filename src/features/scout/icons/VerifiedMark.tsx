import type { Rarity } from "@/features/scout/types/player.types"

/**
 * The site's verified blue (`--verified`) as hex, for the server-drawn cards that cannot read CSS variables:
 * the light theme's tone on metal faces, the dark theme's lighter tone on the dark Icon face.
 */
export const VERIFIED_ON_CARD: Record<Rarity, string> = {
  icon: "#3cbbf9",
  gold: "#0089d0",
  silver: "#0089d0",
  bronze: "#0089d0"
}

type VerifiedMarkProps = {
  size: number
  /** Fill of the seal; the check stays white so it reads on any card face. */
  color: string
  /** Accessible name on the site; Satori ignores it. */
  label?: string
}

/**
 * The verified seal drawn on the card next to the name: a filled version of the `BadgeCheck` icon used in
 * lists, so it holds up on gold and silver faces. Plain SVG, so the site and Satori draw the same shape.
 */
export function VerifiedMark({ size, color, label }: VerifiedMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flexShrink: 0 }}
    >
      {label ? <title>{label}</title> : null}
      <path
        fill={color}
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
      />
      <path
        d="m9 12 2 2 4-4"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
