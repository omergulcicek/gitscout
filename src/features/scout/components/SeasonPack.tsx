import { useEffect, useState } from "react"

import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { RevealConfetti } from "@/features/scout/components/RevealConfetti"
import { COUNTRY_FLAGS } from "@/features/scout/constants/country-flag.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** How long each clue (flag, position, tier) stays before the next one. */
const STEP_MS = 850
const CELEBRATED_RARITIES = new Set(["gold", "icon"])

type Stage = "sealed" | "flag" | "position" | "rarity" | "card"

const SEQUENCE: Stage[] = ["flag", "position", "rarity", "card"]

type SeasonPackProps = {
  player: ScoredPlayer
  year: number
}

/**
 * A sealed pack that opens like a football card pack: the flag, then the position, then the tier, then the
 * card itself. With reduced motion the card shows straight away.
 */
export function SeasonPack({ player, year }: SeasonPackProps) {
  const [stage, setStage] = useState<Stage>("sealed")
  const { cardRef, download, isDownloading } = useCardDownload(`gitscout-${player.login}-${year}`)
  const country = playerCountry(player)
  const Flag = country ? COUNTRY_FLAGS[country] : undefined

  useEffect(() => {
    if (stage === "sealed" || stage === "card") return
    const next = SEQUENCE[SEQUENCE.indexOf(stage) + 1] ?? "card"
    const timer = window.setTimeout(() => setStage(next), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [stage])

  const open = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // A player without a known country skips the flag clue.
    setStage(reduce ? "card" : Flag ? "flag" : "position")
  }

  if (stage === "card") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div data-rarity={player.rarity} className="relative flex w-full max-w-80 justify-center">
          {CELEBRATED_RARITIES.has(player.rarity) ? <RevealConfetti /> : null}
          <div
            aria-hidden
            className="scout-card-glow card-reveal-glow pointer-events-none absolute -inset-8"
          />
          <div className="card-lift relative">
            <div className="card-reveal">
              <PlayerCard player={player} ref={cardRef} occasion="new-year" />
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={download} disabled={isDownloading}>
          {isDownloading ? m.download_preparing() : m.download()}
        </Button>
      </div>
    )
  }

  const sealed = stage === "sealed"
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="img"
        aria-label={m.season_pack_label({ year })}
        data-rarity={stage === "rarity" ? player.rarity : undefined}
        className={cn(
          "season-pack relative flex h-120 w-80 flex-col items-center justify-center gap-4 overflow-hidden rounded-[28px] p-6 text-center",
          !sealed && "season-pack-shake"
        )}
      >
        <span className="font-mono text-xs tracking-[0.4em] text-white/60 uppercase">Gitscout</span>
        {sealed ? (
          <>
            <span className="font-mono text-7xl font-bold tracking-tight text-white tabular-nums">
              {year}
            </span>
            <span className="text-sm text-white/70">{m.season_pack_hint()}</span>
          </>
        ) : (
          // Keyed by stage so each clue plays its entrance again.
          <span
            key={stage}
            className="season-pack-clue flex flex-col items-center gap-3 text-white"
          >
            {stage === "flag" && Flag ? (
              <Flag aria-hidden className="h-16 w-auto rounded-md shadow-lg" />
            ) : null}
            {stage === "position" ? (
              <span className="text-4xl font-bold tracking-tight">{player.position}</span>
            ) : null}
            {stage === "rarity" ? (
              <span className="season-pack-tier text-4xl font-bold tracking-tight">
                {rarityLabel(player.rarity)}
              </span>
            ) : null}
          </span>
        )}
      </div>
      {sealed ? (
        <Button onClick={open}>{m.season_pack_open()}</Button>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {m.season_pack_opening()}
        </p>
      )}
    </div>
  )
}
