import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, RefObject } from "react"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SeasonPack, SnowSeal } from "@/features/scout/components/SeasonPack"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type Stage = "sealed" | "tear" | "draw" | "charge" | "flip" | "facts" | "fly"

/** Card size in px; the ceremony scales it to the screen. */
const CARD_W = 320
const CARD_H = 480
const MAX_SCALE = 1.4
/** Room kept for the bar on top and the numbers and button under the card, on wide and narrow screens. */
const CHROME_WIDE = 56 + 150
const CHROME_NARROW = 56 + 200

const TEAR_MS = 650
const DRAW_MS = 900
const CHARGE_MS = 2000
const FLIP_MS = 700
/** How long the numbers stay before the card flies home on its own. */
const FACTS_MS = 3200
const FLY_MS = 700
const COUNT_MS = 700

/** One number shown under the card once it has turned over. */
export type CeremonyFact = {
  label: string
  value: number
  format: (value: number) => string
}

type SeasonCeremonyProps = {
  player: ListPlayer
  year: number
  voice: "own" | "other"
  facts: CeremonyFact[]
  /** Where the card lands on the page; measured when it flies there. */
  target: RefObject<HTMLElement | null>
  /** "landed" after the card flew to its place, "skipped" when the ceremony was cut short. */
  onClose: (how: "landed" | "skipped") => void
}

/** The card's scale for this screen: as large as fits, up to 1.4×. */
function fitScale(): number {
  const chrome = window.innerWidth >= 640 ? CHROME_WIDE : CHROME_NARROW
  const scale = Math.min(
    MAX_SCALE,
    (window.innerWidth - 32) / CARD_W,
    (window.innerHeight - chrome) / CARD_H
  )
  return Math.max(0.5, scale)
}

/**
 * The season pack, opened full screen over the report, with one action: drag the strip (or tap) to tear the
 * top off. The rest plays by itself: the card comes out face down, its frame heats up in the tier's colour,
 * it turns over, the season's headline numbers count up under it, and it flies to its place on the page as
 * the report shows. "Skip" and Esc end it at any point; the page itself skips it for reduced motion and for
 * packs already opened in this browser.
 */
export function SeasonCeremony({
  player,
  year,
  voice,
  facts,
  target,
  onClose
}: SeasonCeremonyProps) {
  const [stage, setStage] = useState<Stage>("sealed")
  // Unknown on the server; the stage fades in once the browser has measured the screen.
  const [scale, setScale] = useState<number | null>(null)
  const [tornAt, setTornAt] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const resize = () => setScale(fitScale())
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  // The flight home: measured when it starts, so it lands wherever the card's place is now.
  useEffect(() => {
    if (stage !== "fly") return
    const element = cardRef.current
    const card = element?.getBoundingClientRect()
    const slot = target.current?.getBoundingClientRect()
    if (element && card && slot && scale) {
      // The card sits inside the scaled stage, so the move is in its own, unscaled pixels.
      const x = (slot.left + slot.width / 2 - (card.left + card.width / 2)) / scale
      const y = (slot.top + slot.height / 2 - (card.top + card.height / 2)) / scale
      element.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.5, 0, 0.2, 1)`
      element.style.transform = `translate(${x}px, ${y}px) scale(${slot.width / card.width})`
    }
    const timer = window.setTimeout(() => onClose("landed"), FLY_MS)
    return () => window.clearTimeout(timer)
  }, [stage, scale, target, onClose])

  const fly = () => setStage("fly")

  // Everything after the tear plays on timers; a stage change (a skip included) clears the running one.
  useEffect(() => {
    const steps: Partial<Record<Stage, [() => void, number]>> = {
      tear: [() => setStage("draw"), TEAR_MS * (1 - tornAt)],
      draw: [() => setStage("charge"), DRAW_MS],
      charge: [
        () => {
          setStage("flip")
          // A short buzz on phones that have one.
          if ("vibrate" in navigator) navigator.vibrate(20)
        },
        CHARGE_MS
      ],
      flip: [() => setStage("facts"), FLIP_MS],
      facts: [() => setStage("fly"), FACTS_MS]
    }
    const step = steps[stage]
    if (!step) return
    const timer = window.setTimeout(step[0], step[1])
    return () => window.clearTimeout(timer)
  }, [stage, tornAt])

  useEffect(() => {
    if (stage === "facts") continueRef.current?.focus()
  }, [stage])

  const open = (torn: number) => {
    setTornAt(torn)
    setStage("tear")
  }

  // A modal: Esc skips, and Tab stays inside.
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose("skipped")
      return
    }
    if (event.key !== "Tab") return
    const focusable = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? []
    )
    const first = focusable[0]
    const last = focusable.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const packState = stage === "sealed" ? "sealed" : stage === "tear" ? "tear" : "open"
  const showPack = stage === "sealed" || stage === "tear" || stage === "draw"
  const turned = stage === "facts" || stage === "fly"

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={m.season_ceremony_label({ year })}
      data-stage={stage}
      data-rarity={player.rarity}
      onKeyDown={keyDown}
      className="season-ceremony fixed inset-0 z-30 flex flex-col items-center overflow-hidden bg-background"
    >
      <div className="season-ceremony-chrome flex h-14 w-full shrink-0 items-center justify-end px-4">
        <Button variant="ghost" size="sm" onClick={() => onClose("skipped")}>
          <X aria-hidden />
          {m.season_pack_skip()}
        </Button>
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="season-ceremony-stage relative"
          data-ready={scale ? "" : undefined}
          style={{ width: CARD_W * (scale ?? 1), height: CARD_H * (scale ?? 1) }}
        >
          <div
            className="absolute top-0 left-0 h-120 w-80 origin-top-left"
            style={{ transform: `scale(${scale ?? 1})` }}
          >
            <span
              aria-hidden
              className="season-ceremony-burst pointer-events-none absolute -inset-24"
            />

            {stage === "sealed" || stage === "tear" ? null : (
              <div ref={cardRef} className="season-card-draw absolute inset-0">
                <div className="relative size-full [perspective:1400px]">
                  <div className="season-card-flipper relative size-full">
                    <div
                      aria-hidden={!turned}
                      className="season-card-face season-card-front absolute inset-0 flex justify-center"
                    >
                      <SnowyCard player={player} bare={!turned} reveal={turned} />
                      <span
                        aria-hidden
                        className="season-card-shine pointer-events-none absolute inset-0"
                      />
                    </div>
                    <div
                      aria-hidden
                      className="season-card-face season-card-back absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px] text-white"
                    >
                      <SnowSeal className="size-16 text-white/75" />
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
              </div>
            )}

            {showPack ? (
              <div className="season-ceremony-pack absolute inset-0">
                <SeasonPack
                  login={player.login}
                  year={year}
                  voice={voice}
                  state={packState}
                  onOpen={open}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="season-ceremony-chrome flex min-h-36 w-full max-w-2xl shrink-0 flex-col items-center justify-start gap-4 px-4 pt-4 pb-6 text-center max-sm:min-h-48">
        {stage === "sealed" ? (
          <>
            <p className="text-sm text-muted-foreground">{m.season_ceremony_tear_hint()}</p>
            <Button variant="outline" onClick={() => open(0)}>
              {m.season_pack_open()}
            </Button>
          </>
        ) : turned ? (
          <>
            <p role="status" className="sr-only">
              {m.season_pack_revealed({ rarity: rarityLabel(player.rarity), ovr: player.ovr })}
            </p>
            <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {facts.map((fact, index) => (
                <div
                  key={fact.label}
                  className="season-fact flex flex-col items-center gap-0.5"
                  style={{ "--i": index }}
                >
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                  <dd className="font-mono text-2xl leading-tight font-semibold tabular-nums">
                    <CountUp value={fact.value} format={fact.format} delay={150 + index * 180} />
                  </dd>
                </div>
              ))}
            </dl>
            {/* The card flies home on its own; this only goes sooner. */}
            <Button
              ref={continueRef}
              variant="ghost"
              size="sm"
              onClick={fly}
              disabled={stage === "fly"}
            >
              {m.season_ceremony_continue()}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  )
}

/** A number that counts up from zero after a short delay. */
function CountUp({
  value,
  format,
  delay
}: {
  value: number
  format: (value: number) => string
  delay: number
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let frame = 0
    const timer = window.setTimeout(() => {
      const started = performance.now()
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / COUNT_MS)
        setShown(Math.round(value * (1 - (1 - t) ** 3)))
        if (t < 1) frame = window.requestAnimationFrame(tick)
      }
      frame = window.requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(frame)
    }
  }, [value, delay])

  return format(shown)
}
