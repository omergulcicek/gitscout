import { useEffect, useRef, useState } from "react"
import type { PointerEvent, ReactNode } from "react"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type Stage = "sealed" | "tear" | "draw" | "charge" | "flip" | "card"

/** How long each step of the opening lasts: about three seconds in all. */
const STAGE_MS: Record<Exclude<Stage, "sealed" | "card">, number> = {
  tear: 650,
  draw: 900,
  charge: 600,
  flip: 700
}

const SEQUENCE: Stage[] = ["tear", "draw", "charge", "flip", "card"]

/** Pack size in px (w-80 × h-120), the crimp's tooth width and depth, and where the top tears off. */
const PACK_W = 320
const PACK_H = 480
const TOOTH = 8
const TOOTH_DEPTH = 5
const TEAR_Y = 52

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

type SeasonPackProps = {
  player: ListPlayer
  year: number
  /** The owner reads "your card", anyone else "their card". */
  voice: "own" | "other"
  /** Called when the pack is opened; the page turns the snow up for the reveal. */
  onOpen?: () => void
  /** More downloads under the card's own, shown only once the pack is open so nothing spoils it. */
  actions?: ReactNode
}

/**
 * A sealed foil pack that tilts and catches the light under the pointer. Opened, its top tears off along a
 * ragged line, the card is drawn up out of it face down, its back lights up in the tier's colour and it
 * turns over. "Skip" jumps to the end; with reduced motion the card shows straight away.
 */
export function SeasonPack({ player, year, voice, onOpen, actions }: SeasonPackProps) {
  const [stage, setStage] = useState<Stage>("sealed")
  const { cardRef, download, isDownloading } = useCardDownload(`gitscout-${player.login}-${year}`)
  const packRef = useRef<HTMLButtonElement>(null)
  const firstAction = useRef<HTMLButtonElement>(null)
  // The pack leaves the page when it opens; keyboard focus moves to the card's first download.
  const [focusOnReveal, setFocusOnReveal] = useState(false)

  useEffect(() => {
    if (stage === "card" && focusOnReveal) firstAction.current?.focus()
  }, [stage, focusOnReveal])

  // A stage change clears the running timer, so a skip can't be overridden by a late step.
  useEffect(() => {
    if (stage === "sealed" || stage === "card") return
    const next = SEQUENCE[SEQUENCE.indexOf(stage) + 1] ?? "card"
    const timer = window.setTimeout(() => setStage(next), STAGE_MS[stage])
    return () => window.clearTimeout(timer)
  }, [stage])

  const open = () => {
    if (stage !== "sealed") return
    // The pack stops following the pointer: the torn top must line up with the body.
    const style = packRef.current?.style
    for (const name of ["--mx", "--my", "--px", "--rx", "--ry"]) style?.removeProperty(name)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setStage(reduce ? "card" : "tear")
    setFocusOnReveal(true)
    onOpen?.()
  }

  const skip = () => {
    if (stage !== "sealed" && stage !== "card") setStage("card")
  }

  // Pointer position as CSS variables: the light and the tilt follow it without a re-render.
  const track = (event: PointerEvent<HTMLButtonElement>) => {
    if (stage !== "sealed") return
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
    for (const name of ["--mx", "--my", "--px", "--rx", "--ry"]) style.removeProperty(name)
  }

  const sealed = stage === "sealed"
  const showPack = stage === "sealed" || stage === "tear" || stage === "draw"
  const done = stage === "card"

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-stage={stage}
        data-rarity={player.rarity}
        className="season-pack-stage relative h-120 w-80 max-[351px]:[zoom:0.9]"
      >
        {sealed ? null : (
          // The card: face down inside the pack, drawn up out of it, then turned over.
          <div className="season-card-draw absolute inset-0 [perspective:1400px]">
            <div className="season-card-flipper relative size-full">
              <div
                aria-hidden={!done}
                className="season-card-face season-card-front absolute inset-0 flex justify-center"
              >
                <SnowyCard player={player} ref={cardRef} bare={!done} reveal={done} />
                <span
                  aria-hidden
                  className="season-card-shine pointer-events-none absolute inset-y-0 left-1/2 w-80 -translate-x-1/2"
                />
              </div>
              <div
                aria-hidden
                className="season-card-face season-card-back absolute inset-y-0 left-1/2 flex w-80 -translate-x-1/2 flex-col items-center justify-center gap-4 rounded-[28px] text-white max-[351px]:[zoom:0.9]"
              >
                <SnowSeal className="size-16 text-white/70" />
                <span
                  lang="en"
                  className="font-mono text-xs tracking-[0.45em] text-white/70 uppercase"
                >
                  Gitscout
                </span>
                <span className="season-pack-year font-mono text-5xl font-bold tabular-nums">
                  {year}
                </span>
              </div>
            </div>
          </div>
        )}

        {showPack ? (
          // The shadow lives on a wrapper: the crimp's clip-path would cut it off the pack itself.
          <div className="season-pack-shadow absolute inset-0">
            <button
              ref={packRef}
              type="button"
              onClick={open}
              onPointerMove={track}
              onPointerLeave={untrack}
              disabled={!sealed}
              aria-label={m.season_pack_open_label({ year })}
              style={{ clipPath: sealed ? SEALED_CLIP : TORN_CLIP }}
              className="season-pack relative block size-full text-start text-white outline-none disabled:cursor-default"
            >
              <PackSkin />
              <span
                aria-hidden
                className="season-pack-crimp absolute inset-x-0 bottom-0 h-[22px]"
              />
              {/* Tear strip: the dashed line shows where the top will come off. */}
              <span
                aria-hidden
                className="season-pack-strip absolute inset-x-0 top-[22px] flex h-[26px] items-center gap-2 px-4"
              >
                <span className="h-px flex-1 border-t border-dashed border-white/30" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-white/55 uppercase">
                  {m.season_pack_tear()}
                </span>
                <span className="season-pack-notch size-0 border-y-[5px] border-e-[7px] border-y-transparent border-e-white/50" />
              </span>
              {sealed ? null : (
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
              )}
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
                className="absolute inset-x-0 top-[58px] flex items-center justify-between px-5"
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
                className="season-pack-silhouette absolute top-[96px] left-1/2 flex h-[290px] w-[200px] -translate-x-1/2 items-center justify-center rounded-[14px]"
              >
                <span className="season-pack-year font-mono text-7xl font-bold tabular-nums">
                  {year}
                </span>
              </span>

              <span
                aria-hidden
                className="absolute inset-x-0 bottom-[30px] flex flex-col items-center gap-1 px-5 text-center"
              >
                <span className="text-xs text-white/75">
                  {voice === "own" ? m.season_pack_hint_own() : m.season_pack_hint_other()}
                </span>
                <span className="font-mono text-[9px] tracking-[0.18em] text-white/45 uppercase">
                  {m.season_pack_print({ year, serial: serialNumber(player.login) })}
                </span>
              </span>
            </button>
            {stage === "tear" ? (
              // The torn-off top: the same foil, cut along the ragged line, peeling away.
              <span
                aria-hidden
                className="season-pack-flap pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]"
                style={{ clipPath: FLAP_CLIP }}
              >
                <PackSkin />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {sealed ? (
        <Button variant="outline" onClick={open}>
          {m.season_pack_open()}
        </Button>
      ) : done ? (
        <div className="flex w-full max-w-80 flex-col items-center gap-2">
          {/* The season face shows no tier, so it is named under the card. */}
          <p data-rarity={player.rarity} className="season-tier-label">
            {rarityLabel(player.rarity)}
          </p>
          <p role="status" className="sr-only">
            {m.season_pack_revealed({ rarity: rarityLabel(player.rarity), ovr: player.ovr })}
          </p>
          <Button
            ref={firstAction}
            variant="outline"
            className="w-full"
            onClick={download}
            disabled={isDownloading}
          >
            <Download aria-hidden />
            {isDownloading ? m.download_preparing() : m.season_card_download()}
          </Button>
          {actions}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{m.season_pack_opening()}</p>
          <Button variant="ghost" size="sm" onClick={skip}>
            {m.season_pack_skip()}
          </Button>
        </div>
      )}
    </div>
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
