import { useEffect, useRef, useState } from "react"
import type { PointerEvent, ReactNode } from "react"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import type { CardBuild } from "@/features/scout/components/SnowyCard"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { revealCount, revealCountMs, revealRarity } from "@/features/scout/helpers/season-reveal"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type Stage = "sealed" | "tear" | Exclude<CardBuild, "done"> | "card"

/** How long each step lasts; the count's length depends on the rating. About three and a half seconds. */
const STAGE_MS: Record<Exclude<Stage, "sealed" | "count" | "card">, number> = {
  tear: 450,
  rise: 650,
  flag: 400,
  position: 400,
  tier: 900
}

/** A beat of stillness between the last tick of the rating and the tier lighting up. */
const HOLD_MS = 150

const SEQUENCE: Stage[] = ["tear", "rise", "flag", "position", "count", "tier", "card"]

/** Pack size in px (w-80 × h-120) and the crimp's tooth width and depth. */
const PACK_W = 320
const PACK_H = 480
const TOOTH = 8
const TOOTH_DEPTH = 5

/** The pack's outline: straight sides, zigzag crimped edges top and bottom like a sealed foil bag. */
const CRIMP_CLIP = (() => {
  const top: string[] = []
  const bottom: string[] = []
  for (let x = 0, up = true; x <= PACK_W; x += TOOTH / 2, up = !up) {
    top.push(`${x}px ${up ? 0 : TOOTH_DEPTH}px`)
    bottom.push(`${PACK_W - x}px ${up ? PACK_H : PACK_H - TOOTH_DEPTH}px`)
  }
  return `polygon(${[...top, ...bottom].join(", ")})`
})()

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
 * A sealed foil pack that tilts and catches the light under the pointer. Opened, it tears along the top and
 * the real card rises out of it, blank. Its parts land in turn: the flag, the field, then the rating climbs,
 * pausing just under each tier line while the glow behind the card changes colour; the tier lights up as
 * the count stops, and the face, name and snow arrive last. A click on the card or "Skip" jumps to the end.
 * With reduced motion the card shows straight away.
 */
export function SeasonPack({ player, year, voice, onOpen, actions }: SeasonPackProps) {
  const [stage, setStage] = useState<Stage>("sealed")
  const [shownOvr, setShownOvr] = useState(0)
  const { cardRef, download, isDownloading } = useCardDownload(`gitscout-${player.login}-${year}`)
  const country = playerCountry(player)
  const hasFlag = country !== undefined
  const firstAction = useRef<HTMLButtonElement>(null)
  // The pack leaves the page when it opens; keyboard focus moves to the card's first download.
  const [focusOnReveal, setFocusOnReveal] = useState(false)

  useEffect(() => {
    if (stage === "card" && focusOnReveal) firstAction.current?.focus()
  }, [stage, focusOnReveal])

  useEffect(() => {
    if (stage === "sealed" || stage === "card") return
    let next = SEQUENCE[SEQUENCE.indexOf(stage) + 1] ?? "card"
    // A player without a known country skips the flag.
    if (next === "flag" && !hasFlag) next = "position"
    const ms = stage === "count" ? revealCountMs(player.ovr) + HOLD_MS : STAGE_MS[stage]
    const timer = window.setTimeout(() => setStage(next), ms)
    return () => window.clearTimeout(timer)
  }, [stage, hasFlag, player.ovr])

  // The rating climbs frame by frame while the count runs.
  useEffect(() => {
    if (stage !== "count") return
    const started = performance.now()
    let frame = window.requestAnimationFrame(function tick(now) {
      setShownOvr(revealCount(player.ovr, now - started))
      if (now - started < revealCountMs(player.ovr)) frame = window.requestAnimationFrame(tick)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [stage, player.ovr])

  const open = () => {
    if (stage !== "sealed") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setStage(reduce ? "card" : "tear")
    setFocusOnReveal(true)
    onOpen?.()
  }

  // Stage changes clear the running timer and frame, so a skip can't be overridden by a late step.
  const skip = () => {
    if (stage !== "sealed" && stage !== "card") setStage("card")
  }

  // Pointer position as CSS variables: the light and the tilt follow it without a re-render.
  const track = (event: PointerEvent<HTMLButtonElement>) => {
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
  const showPack = stage === "sealed" || stage === "tear" || stage === "rise"
  const build: CardBuild | undefined =
    stage === "sealed" || stage === "tear" ? undefined : stage === "card" ? "done" : stage
  const counted =
    stage === "count" ? shownOvr : stage === "tier" || stage === "card" ? player.ovr : 0
  const lit = stage === "tier" || stage === "card"

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        data-stage={stage}
        className="season-pack-stage relative h-120 w-80 max-[351px]:[zoom:0.9]"
      >
        {build ? (
          // The card rises out of the pack; a click on it skips the rest of the opening.
          <div className="season-card-rise absolute inset-0" onClick={skip}>
            <SnowyCard
              player={{ ...player, ovr: counted }}
              build={build}
              glow={lit ? player.rarity : revealRarity(counted, player.rarity)}
              ref={cardRef}
            />
          </div>
        ) : null}
        {showPack ? (
          // The shadow lives on a wrapper: the crimp's clip-path would cut it off the pack itself.
          <div className="season-pack-shadow absolute inset-0">
            <button
              type="button"
              onClick={open}
              onPointerMove={track}
              onPointerLeave={untrack}
              disabled={!sealed}
              aria-label={m.season_pack_open_label({ year })}
              style={{ clipPath: CRIMP_CLIP }}
              className="season-pack relative block size-full text-start text-white outline-none disabled:cursor-default"
            >
              <span aria-hidden className="season-pack-foil absolute inset-0" />
              <span aria-hidden className="season-pack-holo absolute inset-0" />
              <span aria-hidden className="season-pack-glare absolute inset-0" />
              <span aria-hidden className="season-pack-sweep absolute inset-0" />
              <span aria-hidden className="season-pack-crimp absolute inset-x-0 top-0 h-[22px]" />
              <span
                aria-hidden
                className="season-pack-crimp absolute inset-x-0 bottom-0 h-[22px]"
              />

              {/* Tear strip: flies off first when the pack opens. */}
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
              <span aria-hidden className="season-pack-leak absolute inset-x-6 top-[30px] h-6" />

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
                <SnowSeal />
              </span>

              {/* The card waiting inside, as a raised shape: no colour, so the tier stays a secret. */}
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
          </div>
        ) : null}
      </div>

      {sealed ? (
        <Button variant="outline" onClick={open}>
          {m.season_pack_open()}
        </Button>
      ) : stage === "card" ? (
        <div className="flex w-full max-w-80 flex-col items-center gap-2">
          {/* The season face shows no tier, so it is named under the card. */}
          <p data-rarity={player.rarity} className="season-tier-label">
            {rarityLabel(player.rarity)}
          </p>
          {/* One announcement once the card is complete; the steps before it are visual only. */}
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
          {lit ? (
            <p data-rarity={player.rarity} className="season-tier-label season-tier-label-in">
              {rarityLabel(player.rarity)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{m.season_pack_opening()}</p>
          )}
          <Button variant="ghost" size="sm" onClick={skip}>
            {m.season_pack_skip()}
          </Button>
        </div>
      )}
    </div>
  )
}

/** A small six-armed snowflake stamped on the pack like a seal. */
function SnowSeal() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-white/60" fill="none" stroke="currentColor">
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 12 12)`} strokeWidth="1.3" strokeLinecap="round">
          <path d="M12 2v20" />
          <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
        </g>
      ))}
    </svg>
  )
}
