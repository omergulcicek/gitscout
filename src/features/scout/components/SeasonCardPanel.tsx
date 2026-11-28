import { useEffect, useRef } from "react"
import type { ReactNode, Ref } from "react"

import { Download, RotateCcw } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type SeasonCardPanelProps = {
  player: ListPlayer
  year: number
  /** While the pack is being opened: the card's place is kept, empty, for it to fly into. */
  waiting: boolean
  /** The card has just flown in: the glow fades in and the snow drops onto it. */
  arrived: boolean
  /** Move keyboard focus to the first download, as the ceremony's dialog closes. */
  focusDownload: boolean
  /** The card's place on the page, measured by the ceremony. */
  slotRef: Ref<HTMLDivElement>
  /** More downloads under the card's own. */
  actions: ReactNode
  onReopen: () => void
}

/** The season card on the page, with its tier, its downloads and a way to open the pack again. */
export function SeasonCardPanel({
  player,
  year,
  waiting,
  arrived,
  focusDownload,
  slotRef,
  actions,
  onReopen
}: SeasonCardPanelProps) {
  const { cardRef, download, isDownloading } = useCardDownload(`gitscout-${player.login}-${year}`)
  const firstAction = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!waiting && focusDownload) firstAction.current?.focus()
  }, [waiting, focusDownload])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        ref={slotRef}
        className={cn("flex h-120 w-80 max-w-full justify-center", waiting && "invisible")}
      >
        {waiting ? null : <SnowyCard player={player} ref={cardRef} reveal={arrived} />}
      </div>
      {waiting ? null : (
        <div className="flex w-full max-w-80 flex-col items-center gap-2">
          {/* The season face shows no tier, so it is named under the card. */}
          <p data-rarity={player.rarity} className="season-tier-label">
            {rarityLabel(player.rarity)}
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
          <Button variant="ghost" size="sm" onClick={onReopen}>
            <RotateCcw aria-hidden />
            {m.season_ceremony_reopen()}
          </Button>
        </div>
      )}
    </div>
  )
}
