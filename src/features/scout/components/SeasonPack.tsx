import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { Download } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { COUNTRY_FLAGS } from "@/features/scout/constants/country-flag.constants"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** How long each clue (flag, position, tier) stays before the next one. */
const STEP_MS = 850

type Stage = "sealed" | "flag" | "position" | "rarity" | "card"

const SEQUENCE: Stage[] = ["flag", "position", "rarity", "card"]

type SeasonPackProps = {
  player: ListPlayer
  year: number
  /** Called when the pack is opened; the page turns the snow up for the reveal. */
  onOpen?: () => void
  /** More downloads under the card's own, shown only once the pack is open so nothing spoils it. */
  actions?: ReactNode
}

/**
 * A sealed pack that opens like a collectible card pack: the flag, then the position, then the tier, then the
 * card itself. With reduced motion the card shows straight away.
 */
export function SeasonPack({ player, year, onOpen, actions }: SeasonPackProps) {
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
    onOpen?.()
  }

  if (stage === "card") {
    return (
      <div className="flex flex-col items-center gap-4">
        <SnowyCard player={player} ref={cardRef} reveal />
        <div className="flex w-full max-w-80 flex-col gap-2">
          <Button variant="outline" className="w-full" onClick={download} disabled={isDownloading}>
            <Download aria-hidden />
            {isDownloading ? m.download_preparing() : m.season_card_download()}
          </Button>
          {actions}
        </div>
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
