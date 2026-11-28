import type { PointerEvent } from "react"

import * as m from "@/paraglide/messages.js"

/** Pack size in px (w-80 × h-120), and the crimp's tooth width and depth. */
const PACK_W = 320
const PACK_H = 480
const TOOTH = 8
const TOOTH_DEPTH = 5

/** The crimped top and bottom edges, left to right, as polygon points. */
const crimp = (edge: "top" | "bottom") => {
  const points: string[] = []
  for (let x = 0, up = true; x <= PACK_W; x += TOOTH / 2, up = !up) {
    const y = edge === "top" ? (up ? 0 : TOOTH_DEPTH) : up ? PACK_H : PACK_H - TOOTH_DEPTH
    points.push(`${x}px ${y}px`)
  }
  return points
}

const polygon = (points: string[]) => `polygon(${points.join(", ")})`

/** The sealed pack: straight sides, zigzag crimped edges top and bottom like a foil bag. */
const SEALED_CLIP = polygon([...crimp("top"), ...crimp("bottom").reverse()])

type Point = readonly [number, number]

/** A fixed wobble in −1…1, so the server and the browser cut the same pieces. */
const wobble = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}

/**
 * The pieces the pack breaks into, like an eggshell: a 3 × 4 grid whose inner corners are pushed about and
 * whose edges kink in the middle, so no two pieces are the same shape. Neighbours share their edges exactly.
 */
const SHATTER = (() => {
  const xs = [0, 107, 213, 320] as const
  const ys = [0, 120, 240, 360, 480] as const
  const inner = (index: number, length: number) => index > 0 && index < length - 1
  const corner = (row: number, col: number): Point => [
    (xs[col] ?? 0) + (inner(col, xs.length) ? wobble(row * 7 + col) * 26 : 0),
    (ys[row] ?? 0) + (inner(row, ys.length) ? wobble(row * 11 + col * 3 + 1) * 22 : 0)
  ]
  // The kink in the middle of an edge, pushed sideways; edges on the pack's outline stay straight.
  const kink = (a: Point, b: Point, seed: number, straight: boolean): Point => {
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    if (straight) return mid
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const push = wobble(seed) * 14
    return [mid[0] + ((b[1] - a[1]) / length) * push, mid[1] - ((b[0] - a[0]) / length) * push]
  }
  const across = (row: number, col: number) =>
    kink(corner(row, col), corner(row, col + 1), row * 13 + col + 50, !inner(row, ys.length))
  const down = (row: number, col: number) =>
    kink(corner(row, col), corner(row + 1, col), row * 17 + col + 90, !inner(col, xs.length))

  const pieces: { points: Point[]; center: Point }[] = []
  const cracks: Point[][] = []
  for (let row = 0; row < ys.length - 1; row++) {
    for (let col = 0; col < xs.length - 1; col++) {
      const points = [
        corner(row, col),
        across(row, col),
        corner(row, col + 1),
        down(row, col + 1),
        corner(row + 1, col + 1),
        across(row + 1, col),
        corner(row + 1, col),
        down(row, col)
      ]
      const center: Point = [
        points.reduce((sum, point) => sum + point[0], 0) / points.length,
        points.reduce((sum, point) => sum + point[1], 0) / points.length
      ]
      pieces.push({ points, center })
      // Each inner edge once: the piece's bottom and right edges, where they aren't the outline.
      if (inner(row + 1, ys.length)) {
        cracks.push([corner(row + 1, col), across(row + 1, col), corner(row + 1, col + 1)])
      }
      if (inner(col + 1, xs.length)) {
        cracks.push([corner(row, col + 1), down(row, col + 1), corner(row + 1, col + 1)])
      }
    }
  }

  return {
    pieces: pieces.map(({ points, center }, index) => {
      // Outwards from the middle of the pack, a little downwards as if falling, each its own spin.
      const dx = center[0] - PACK_W / 2
      const dy = center[1] - PACK_H / 2
      const length = Math.hypot(dx, dy) || 1
      const distance = 320 + ((index * 53) % 180)
      return {
        clip: polygon(points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)),
        style: {
          "--dx": `${((dx / length) * distance).toFixed(0)}px`,
          "--dy": `${((dy / length) * distance + 80).toFixed(0)}px`,
          "--spin": `${(wobble(index + 200) * 160).toFixed(0)}deg`,
          "--delay": `${(index % 4) * 25}ms`
        }
      }
    }),
    cracks: cracks.map((line) => line.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "))
  }
})()

/** A stable six-digit "serial number" for the print on the pack, the same for a login every time. */
function serialNumber(login: string): string {
  let hash = 0
  for (const char of login.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return String(hash % 1_000_000).padStart(6, "0")
}

const POINTER_VARS = ["--mx", "--my", "--px", "--rx", "--ry"]

type SeasonPackProps = {
  login: string
  year: number
  /** The owner reads "your card", anyone else "their card". */
  voice: "own" | "other"
  /** "charge": trembling and cracking; "shatter": breaking apart, its pieces flying off. */
  state: "sealed" | "charge" | "shatter"
  onOpen: () => void
}

/**
 * A sealed foil pack that tilts and catches the light under the pointer. Opened, it trembles like an egg
 * about to hatch while cracks run across it, then breaks into pieces that fly off in every direction.
 */
export function SeasonPack({ login, year, voice, state, onOpen }: SeasonPackProps) {
  const sealed = state === "sealed"

  // Pointer position as CSS variables: the light and the tilt follow it without a re-render.
  const track = (event: PointerEvent<HTMLButtonElement>) => {
    if (!sealed) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    const style = event.currentTarget.style
    style.setProperty("--mx", `${x * 100}%`)
    style.setProperty("--my", `${y * 100}%`)
    style.setProperty("--px", String(x))
    style.setProperty("--rx", `${(0.5 - y) * 12}deg`)
    style.setProperty("--ry", `${(x - 0.5) * 12}deg`)
  }
  const untrack = (event: PointerEvent<HTMLButtonElement>) => {
    const style = event.currentTarget.style
    for (const name of POINTER_VARS) style.removeProperty(name)
  }

  const face = <PackFace login={login} year={year} voice={voice} />

  if (state === "shatter") {
    return (
      <div aria-hidden data-pack={state} className="season-pack-root relative h-120 w-80">
        {SHATTER.pieces.map((piece, index) => (
          <span
            key={index}
            className="season-pack-shard absolute inset-0"
            style={{ ...piece.style, clipPath: piece.clip }}
          >
            <span className="absolute inset-0" style={{ clipPath: SEALED_CLIP }}>
              {face}
            </span>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div data-pack={state} className="season-pack-root relative h-120 w-80">
      {/* The shadow lives on a wrapper: the crimp's clip-path would cut it off the pack itself. */}
      <div className="season-pack-shadow absolute inset-0">
        <button
          type="button"
          onClick={(event) => {
            for (const name of POINTER_VARS) event.currentTarget.style.removeProperty(name)
            onOpen()
          }}
          onPointerMove={track}
          onPointerLeave={untrack}
          disabled={!sealed}
          aria-label={m.season_pack_open_label({ year })}
          style={{ clipPath: SEALED_CLIP }}
          className="season-pack relative block size-full text-start text-white outline-none disabled:cursor-default"
        >
          {face}
          {sealed ? null : (
            // The cracks spreading across the pack, lit from inside.
            <svg
              aria-hidden
              viewBox={`0 0 ${PACK_W} ${PACK_H}`}
              className="pointer-events-none absolute inset-0 size-full"
            >
              {SHATTER.cracks.map((points, index) => (
                <polyline
                  key={points}
                  points={points}
                  pathLength={1}
                  className="season-pack-crack"
                  style={{ "--i": index }}
                />
              ))}
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

/** Everything printed on the pack: drawn on the pack itself and again on each of its pieces. */
function PackFace({ login, year, voice }: { login: string; year: number; voice: "own" | "other" }) {
  return (
    <>
      <span aria-hidden className="season-pack-foil absolute inset-0" />
      <span aria-hidden className="season-pack-holo absolute inset-0" />
      <span aria-hidden className="season-pack-glare absolute inset-0" />
      <span aria-hidden className="season-pack-sweep absolute inset-0" />
      <span
        aria-hidden
        className="season-pack-crimp season-pack-crimp-top absolute inset-x-0 top-0 h-[22px]"
      />
      <span aria-hidden className="season-pack-crimp absolute inset-x-0 bottom-0 h-[22px]" />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[40px] flex items-center justify-between px-5"
      >
        {/* The brand uppercases as English: in Turkish its "i" would turn into "İ". */}
        <span lang="en" className="font-mono text-[11px] tracking-[0.4em] text-white/70 uppercase">
          Gitscout
        </span>
        <SnowSeal className="size-5 text-white/60" />
      </span>

      {/* The card waiting inside, as a raised shape. */}
      <span
        aria-hidden
        className="season-pack-silhouette pointer-events-none absolute top-[80px] left-1/2 flex h-[300px] w-[210px] -translate-x-1/2 items-center justify-center rounded-[14px]"
      >
        <span className="season-pack-year font-mono text-7xl font-bold tabular-nums">{year}</span>
      </span>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[30px] flex flex-col items-center gap-1 px-5 text-center"
      >
        <span className="text-xs text-white/75">
          {voice === "own" ? m.season_pack_hint_own() : m.season_pack_hint_other()}
        </span>
        <span className="font-mono text-[9px] tracking-[0.18em] text-white/45 uppercase">
          {m.season_pack_print({ year, serial: serialNumber(login) })}
        </span>
      </span>
    </>
  )
}

/** A six-armed snowflake stamped on the pack like a seal. */
function SnowSeal({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 12 12)`} strokeWidth="1.3" strokeLinecap="round">
          <path d="M12 2v20" />
          <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
        </g>
      ))}
    </svg>
  )
}
