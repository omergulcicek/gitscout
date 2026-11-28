import { useEffect, useRef } from "react"
import type { PointerEvent } from "react"

import { simulateShard } from "@/features/scout/helpers/shard-physics"
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
 * The pieces the pack breaks into, like a shell struck just above its middle: cracks run out from the
 * impact at uneven angles and rings of cracks cross them at uneven distances, so the pieces are small and
 * many near the impact and larger towards the edges, no two the same. Neighbours share their edges exactly;
 * the outer ring lies past the pack's outline, which trims it.
 */
const SHATTER = (() => {
  const impact: Point = [PACK_W * 0.47, PACK_H * 0.42]
  const spokes = 13
  // Crack angles: evenly spread, then each nudged so the slices differ in width.
  const angles = Array.from(
    { length: spokes },
    (_, index) => ((index + wobble(index + 300) * 0.38) / spokes) * Math.PI * 2
  )
  // Ring distances from the impact; each crack crosses them a little nearer or farther.
  const rings = [0, 34, 82, 150, 240, 700]
  const vertex = (spoke: number, ring: number): Point => {
    const angle = angles[spoke % spokes] ?? 0
    const base = rings[ring] ?? 0
    const radius =
      ring === 0 || ring === rings.length - 1
        ? base
        : base * (1 + wobble(spoke * 7 + ring * 31) * 0.22)
    return [impact[0] + Math.cos(angle) * radius, impact[1] + Math.sin(angle) * radius]
  }
  // A kink in the middle of a ring's segment, so its cracks aren't straight lines.
  const ringKink = (spoke: number, ring: number): Point => {
    const a = vertex(spoke, ring)
    const b = vertex(spoke + 1, ring)
    const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    const out = Math.hypot(mid[0] - impact[0], mid[1] - impact[1]) || 1
    const push = wobble(spoke * 13 + ring * 5 + 700) * Math.min(10, (rings[ring] ?? 0) * 0.12)
    return [
      mid[0] + ((mid[0] - impact[0]) / out) * push,
      mid[1] + ((mid[1] - impact[1]) / out) * push
    ]
  }

  const pieces: { points: Point[]; center: Point; size: number }[] = []
  const cracks: { points: Point[]; order: number }[] = []
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let spoke = 0; spoke < spokes; spoke++) {
      const points: Point[] =
        ring === 0
          ? [impact, vertex(spoke, 1), ringKink(spoke, 1), vertex(spoke + 1, 1)]
          : [
              vertex(spoke, ring),
              vertex(spoke, ring + 1),
              ...(ring + 1 < rings.length - 1 ? [ringKink(spoke, ring + 1)] : []),
              vertex(spoke + 1, ring + 1),
              vertex(spoke + 1, ring),
              ringKink(spoke, ring)
            ]
      const center: Point = [
        points.reduce((sum, point) => sum + point[0], 0) / points.length,
        points.reduce((sum, point) => sum + point[1], 0) / points.length
      ]
      pieces.push({ points, center, size: rings[ring + 1] ?? 0 })
      // The crack running out along this spoke, and the ring crack closing the piece from outside.
      cracks.push({ points: [vertex(spoke, ring), vertex(spoke, ring + 1)], order: ring * 2 })
      if (ring + 1 < rings.length - 1) {
        cracks.push({
          points: [vertex(spoke, ring + 1), ringKink(spoke, ring + 1), vertex(spoke + 1, ring + 1)],
          order: ring * 2 + 1
        })
      }
    }
  }

  return {
    pieces: pieces.map(({ points, size }, index) => {
      // The part of the piece inside the pack's outline: its middle is where it turns, and its size how
      // high it lies on the floor.
      const inside = points.map(([x, y]): Point => [
        Math.min(PACK_W, Math.max(0, x)),
        Math.min(PACK_H, Math.max(0, y))
      ])
      const center: Point = [
        inside.reduce((sum, point) => sum + point[0], 0) / inside.length,
        inside.reduce((sum, point) => sum + point[1], 0) / inside.length
      ]
      const radius = Math.max(...inside.map(([x, y]) => Math.hypot(x - center[0], y - center[1])))
      // Most pieces are flung off the screen in every direction, barely pulled down; a few of the larger
      // ones only break loose and drop to the floor, where they stay.
      const dx = center[0] - impact[0]
      const dy = center[1] - impact[1]
      const length = Math.hypot(dx, dy) || 1
      const drops = size >= 150 && wobble(index + 600) > 0.35
      const speed = drops
        ? 0.18 + Math.abs(wobble(index + 500)) * 0.15
        : 1.1 + Math.abs(wobble(index + 500)) * 0.9
      return {
        clip: polygon(points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)),
        center,
        radius,
        drops,
        vx: (dx / length) * speed,
        vy: (dy / length) * speed - (drops ? 0.35 : 0),
        spin: wobble(index + 200) * (drops ? 0.3 : 0.9),
        gravity: drops ? 0.0034 : 0.0009,
        delay: Math.round(Math.abs(wobble(index + 900)) * 60)
      }
    }),
    cracks: cracks
      .sort((a, b) => a.order - b.order)
      .map(({ points }) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "))
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
 * about to hatch while cracks run across it, then breaks into pieces flung in every direction, a few of
 * them dropping to the floor.
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

  if (state === "shatter") return <Shards login={login} year={year} voice={voice} />

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

/** How long the pieces are followed, and how often their path is sampled for the animation. */
const FALL_MS = 3000
const FALL_FRAME_MS = 32

/**
 * The broken pack: each piece is the whole pack cut to its shape. Most are flung off the screen in every
 * direction; a few drop to the bottom of the screen, where they bounce, slide and stay. The paths come from `simulateShard`, played as Web
 * Animations so they keep going without re-rendering.
 */
function Shards({ login, year, voice }: { login: string; year: number; voice: "own" | "other" }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    // The pack is scaled to the screen: the floor and walls are measured in its own, unscaled pixels.
    const rect = root.getBoundingClientRect()
    const scale = rect.width / PACK_W || 1
    const bounds = {
      floor: (window.innerHeight - rect.top) / scale - 4,
      left: -rect.left / scale,
      right: (window.innerWidth - rect.left) / scale
    }
    const free = { floor: Infinity, left: -Infinity, right: Infinity }
    const animations = Array.from(root.children).map((element, index) => {
      const piece = SHATTER.pieces[index]
      if (!piece) return undefined
      const frames = simulateShard(
        { ...piece, ...(piece.drops ? bounds : free) },
        FALL_MS,
        FALL_FRAME_MS
      )
      return element.animate(
        frames.map((frame, at) => ({
          transform: `translate(${frame.x}px, ${frame.y}px) rotate(${frame.angle}deg)`,
          // A flung piece fades as it goes, in case it ends up still on screen.
          opacity: piece.drops ? 1 : Math.max(0, 1 - Math.max(0, at / frames.length - 0.35) * 2.5)
        })),
        { duration: FALL_MS, delay: piece.delay, fill: "forwards" }
      )
    })
    return () => {
      for (const animation of animations) animation?.cancel()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-pack="shatter"
      className="season-pack-root relative h-120 w-80"
    >
      {SHATTER.pieces.map((piece, index) => (
        <span
          key={index}
          className="season-pack-shard absolute inset-0"
          style={{
            clipPath: piece.clip,
            transformOrigin: `${piece.center[0]}px ${piece.center[1]}px`
          }}
        >
          <span className="absolute inset-0" style={{ clipPath: SEALED_CLIP }}>
            <PackFace login={login} year={year} voice={voice} lite />
          </span>
        </span>
      ))}
    </div>
  )
}

/** Everything printed on the pack: drawn on the pack itself and again on each of its pieces. */
function PackFace({
  login,
  year,
  voice,
  lite = false
}: {
  login: string
  year: number
  voice: "own" | "other"
  /** Without the moving lights: the pieces are many and only on screen for a moment. */
  lite?: boolean
}) {
  return (
    <>
      <span aria-hidden className="season-pack-foil absolute inset-0" />
      {lite ? null : (
        <>
          <span aria-hidden className="season-pack-holo absolute inset-0" />
          <span aria-hidden className="season-pack-glare absolute inset-0" />
          <span aria-hidden className="season-pack-sweep absolute inset-0" />
        </>
      )}
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
