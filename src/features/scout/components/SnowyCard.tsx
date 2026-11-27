import type { Ref } from "react"

import { cn } from "cn"

import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { SnowCap } from "@/features/scout/icons/SnowCap"
import type { ListPlayer } from "@/features/scout/types/player.types"

type SnowyCardProps = {
  player: ListPlayer
  /** Plays the flip-in; otherwise the card is simply there. */
  reveal?: boolean
  ref?: Ref<HTMLElement>
}

/**
 * The season's card: the New Year face with frosted corners, a glow in the tier's colours and snow
 * settled on its top edge. The snow sits outside the captured card, so downloads stay clean.
 */
export function SnowyCard({ player, reveal = false, ref }: SnowyCardProps) {
  return (
    <div data-rarity={player.rarity} className="relative flex w-full max-w-80 justify-center">
      <div
        aria-hidden
        className={cn(
          "scout-card-glow pointer-events-none absolute -inset-8",
          reveal && "card-reveal-glow"
        )}
      />
      <div className="card-lift relative">
        <div className={cn("season-frost relative", reveal && "card-reveal")}>
          <PlayerCard player={player} ref={ref} occasion="new-year" />
        </div>
        <SnowCap
          className={cn(
            "pointer-events-none absolute -top-3 -right-1.5 -left-1.5 h-10 w-[calc(100%+0.75rem)]",
            reveal && "season-snow-cap"
          )}
        />
      </div>
    </div>
  )
}
