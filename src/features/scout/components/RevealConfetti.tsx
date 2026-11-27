import type { CSSProperties } from "react"

const COLORS = [
  "var(--frame-1)",
  "var(--frame-2)",
  "var(--github-star)",
  "var(--verified)",
  "var(--chart-away)",
  "var(--chart-home)"
]
/** Pieces fired from each side; a few more rain from the top. */
const PER_SIDE = 40
const FROM_TOP = 24

type Piece = { key: string; style: CSSProperties }

/**
 * Deterministic pseudo-random spread so the server and the browser render the same pieces.
 * `seed` is the piece index; the result is in [0, 1).
 */
function spread(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function sidePieces(side: "left" | "right"): Piece[] {
  const direction = side === "left" ? 1 : -1
  return Array.from({ length: PER_SIDE }, (_, index) => {
    // Each piece leaves the lower part of the screen edge, arcs inwards and up, then falls.
    const reach = 25 + spread(index, side === "left" ? 1 : 2) * 45 // vw
    const rise = 35 + spread(index, 3) * 40 // vh
    return {
      key: `${side}-${index}`,
      style: {
        [side]: 0,
        top: `${60 + spread(index, 4) * 25}vh`,
        backgroundColor: COLORS[index % COLORS.length],
        animationName: "reveal-confetti-burst",
        animationDelay: `${Math.round(spread(index, 5) * 220)}ms`,
        ["--dx" as string]: `${direction * reach}vw`,
        ["--rise" as string]: `${-rise}vh`,
        ["--spin" as string]: `${direction * (360 + Math.round(spread(index, 6) * 540))}deg`
      }
    }
  })
}

function topPieces(): Piece[] {
  return Array.from({ length: FROM_TOP }, (_, index) => ({
    key: `top-${index}`,
    style: {
      left: `${Math.round(spread(index, 7) * 100)}%`,
      top: "-1rem",
      backgroundColor: COLORS[index % COLORS.length],
      animationName: "reveal-confetti-rain",
      animationDelay: `${250 + Math.round(spread(index, 8) * 500)}ms`,
      ["--dx" as string]: `${Math.round(spread(index, 9) * 120) - 60}px`,
      ["--spin" as string]: `${180 + Math.round(spread(index, 10) * 540)}deg`
    }
  }))
}

/**
 * The celebration for a freshly revealed gold or icon card: two bursts fired in from the left and right
 * edges plus a light rain from the top. Plays once; hidden when the visitor prefers reduced motion.
 */
export function RevealConfetti() {
  const pieces = [...sidePieces("left"), ...sidePieces("right"), ...topPieces()]
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((piece) => (
        <span key={piece.key} className="reveal-confetti-piece" style={piece.style} />
      ))}
    </div>
  )
}
