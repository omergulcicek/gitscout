import { useRef, useState } from "react"
import type { MouseEvent, PointerEvent } from "react"

import * as m from "@/paraglide/messages.js"

/** Pack size in px (w-80 × h-120), the crimp's tooth width and depth, and where the top tears off. */
const PACK_W = 320
const PACK_H = 480
const TOOTH = 8
const TOOTH_DEPTH = 5
const TEAR_Y = 52

/** How far along the strip a drag must go before the tear carries on by itself. */
const TEAR_COMMIT = 0.55
/** A drag this many px or less counts as a click. */
const DRAG_SLOP = 6

/** The crimped top and bottom edges, left to right, as polygon points. */
const crimp = (edge: "top" | "bottom") => {
  const points: string[] = []
  for (let x = 0, up = true; x <= PACK_W; x += TOOTH / 2, up = !up) {
    const y = edge === "top" ? (up ? 0 : TOOTH_DEPTH) : up ? PACK_H : PACK_H - TOOTH_DEPTH
    points.push(`${x}px ${y}px`)
  }
  return points
}

/** The ragged tear, left to right: a fixed pattern so the server and the browser draw the same line. */
const TEAR_POINTS = (() => {
  const offsets = [0, -3, 2, -1, 4, -2, 1, 3, -4, 2, -1, 3, -3, 1, 4, -2, 0, 2, -3, 1, 3, -1, -4, 2]
  const step = PACK_W / (offsets.length - 1)
  return offsets.map((offset, index) => [Math.round(index * step), TEAR_Y + offset] as const)
})()
const TEAR_LINE = TEAR_POINTS.map(([x, y]) => `${x}px ${y}px`)

const polygon = (points: string[]) => `polygon(${points.join(", ")})`

/** The sealed pack: straight sides, zigzag crimped edges top and bottom like a foil bag. */
const SEALED_CLIP = polygon([...crimp("top"), ...crimp("bottom").reverse()])
/** The pack once torn: the ragged line on top. */
const TORN_CLIP = polygon([...TEAR_LINE, ...crimp("bottom").reverse()])
/** The strip that tears away: the crimped top down to the ragged line. */
const FLAP_CLIP = polygon([...crimp("top"), ...[...TEAR_LINE].reverse()])

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
  /** "tear" plays the rest of the tear from wherever the drag left it; "open" is the torn, empty pack. */
  state: "sealed" | "tear" | "open"
  /** Asks to open, with how far the top is already torn (0 when clicked). */
  onOpen: (torn: number) => void
}

/**
 * A sealed foil pack that tilts and catches the light under the pointer. Its top tears off along a ragged
 * line: drag along the strip and the flap follows the pointer, let go early and it settles back, go past
 * the middle and it tears off. A click, a tap or the keyboard opens it in one go.
 */
export function SeasonPack({ login, year, voice, state, onOpen }: SeasonPackProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const packRef = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ x: number; width: number; moved: boolean; torn: number } | null>(null)
  // A drag ends in a click on the pack; that click must not open it a second time.
  const swallowClick = useRef(false)
  const [peeling, setPeeling] = useState(false)
  const sealed = state === "sealed"
  const torn = !sealed || peeling

  const setTear = (value: number) => rootRef.current?.style.setProperty("--tear", String(value))

  const open = (amount: number) => {
    const style = packRef.current?.style
    for (const name of POINTER_VARS) style?.removeProperty(name)
    onOpen(amount)
  }

  const startDrag = (event: PointerEvent<HTMLSpanElement>) => {
    if (!sealed || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const width = packRef.current?.getBoundingClientRect().width ?? PACK_W
    drag.current = { x: event.clientX, width, moved: false, torn: 0 }
  }

  const moveDrag = (event: PointerEvent<HTMLSpanElement>) => {
    const current = drag.current
    if (!current) return
    const distance = Math.abs(event.clientX - current.x)
    if (!current.moved && distance <= DRAG_SLOP) return
    if (!current.moved) {
      current.moved = true
      setPeeling(true)
    }
    current.torn = Math.min(1, distance / (current.width * 0.8))
    setTear(current.torn)
  }

  const endDrag = () => {
    const current = drag.current
    drag.current = null
    if (!current?.moved) return
    swallowClick.current = true
    if (current.torn >= TEAR_COMMIT) {
      open(current.torn)
      return
    }
    // Not far enough: the flap settles back onto the pack.
    rootRef.current?.setAttribute("data-settling", "")
    setTear(0)
    window.setTimeout(() => {
      rootRef.current?.removeAttribute("data-settling")
      setPeeling(false)
    }, 250)
  }

  const click = (event: MouseEvent<HTMLButtonElement>) => {
    if (swallowClick.current) {
      swallowClick.current = false
      return
    }
    if (sealed && !peeling) {
      event.currentTarget.blur()
      open(0)
    }
  }

  // Pointer position as CSS variables: the light and the tilt follow it without a re-render.
  const track = (event: PointerEvent<HTMLButtonElement>) => {
    if (!sealed || peeling) return
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

  return (
    <div
      ref={rootRef}
      data-pack={state}
      data-peeling={peeling ? "" : undefined}
      className="season-pack-root relative h-120 w-80"
    >
      {/* The shadow lives on a wrapper: the crimp's clip-path would cut it off the pack itself. */}
      <div className="season-pack-shadow absolute inset-0">
        <button
          ref={packRef}
          type="button"
          onClick={click}
          onPointerMove={track}
          onPointerLeave={untrack}
          disabled={!sealed}
          aria-label={m.season_pack_open_label({ year })}
          style={{ clipPath: torn ? TORN_CLIP : SEALED_CLIP }}
          className="season-pack relative block size-full text-start text-white outline-none disabled:cursor-default"
        >
          <PackSkin />
          <span aria-hidden className="season-pack-crimp absolute inset-x-0 bottom-0 h-[22px]" />
          {/* The grip: the whole top band can be dragged; the tear starts from the notch. */}
          <span
            aria-hidden
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="season-pack-grip absolute inset-x-0 top-0 h-[56px] cursor-grab touch-none active:cursor-grabbing"
          >
            {torn ? null : <TearStrip />}
          </span>
          {torn ? (
            // The torn foil's pale fibres along the ragged edge.
            <svg
              aria-hidden
              viewBox={`0 0 ${PACK_W} ${PACK_H}`}
              className="pointer-events-none absolute inset-0 size-full"
            >
              <polyline
                points={TEAR_POINTS.map(([x, y]) => `${x},${y + 1}`).join(" ")}
                fill="none"
                stroke="rgb(232 242 255 / 0.75)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
          <span
            aria-hidden
            className="season-pack-mouth absolute inset-x-0 h-7"
            style={{ top: TEAR_Y - 4 }}
          />
          <span
            aria-hidden
            className="season-pack-leak absolute inset-x-6 h-6"
            style={{ top: TEAR_Y - 10 }}
          />

          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[62px] flex items-center justify-between px-5"
          >
            {/* The brand uppercases as English: in Turkish its "i" would turn into "İ". */}
            <span
              lang="en"
              className="font-mono text-[11px] tracking-[0.4em] text-white/70 uppercase"
            >
              Gitscout
            </span>
            <SnowSeal className="size-5 text-white/60" />
          </span>

          {/* The card waiting inside, as a raised shape. */}
          <span
            aria-hidden
            className="season-pack-silhouette pointer-events-none absolute top-[98px] left-1/2 flex h-[290px] w-[200px] -translate-x-1/2 items-center justify-center rounded-[14px]"
          >
            <span className="season-pack-year font-mono text-7xl font-bold tabular-nums">
              {year}
            </span>
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
        </button>
        {torn && state !== "open" ? (
          // The torn-off top: the same foil, cut along the ragged line. It follows the drag (paused at
          // --tear), then plays the rest on its own once the tear goes through.
          <span
            aria-hidden
            className="season-pack-flap pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]"
            style={{ clipPath: FLAP_CLIP }}
          >
            <PackSkin />
            <TearStrip />
          </span>
        ) : null}
      </div>
    </div>
  )
}

/** The dashed line and the notch showing where the top comes off. */
function TearStrip() {
  return (
    <span className="absolute inset-x-0 top-[22px] flex h-[26px] items-center gap-2 px-4">
      <span className="h-px flex-1 border-t border-dashed border-white/30" />
      <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">
        {m.season_pack_tear()}
      </span>
      <span className="season-pack-notch size-0 border-y-[5px] border-e-[7px] border-y-transparent border-e-white/50" />
    </span>
  )
}

/** The foil and its lights, shared by the pack and the strip torn off its top so the two match. */
function PackSkin() {
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
    </>
  )
}

/** A six-armed snowflake stamped on the pack and the card's back like a seal. */
export function SnowSeal({ className }: { className: string }) {
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
