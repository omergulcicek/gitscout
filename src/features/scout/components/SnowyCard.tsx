import type { Ref } from "react"

import { cn } from "cn"

import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { SnowCap } from "@/features/scout/icons/SnowCap"
import type { ListPlayer } from "@/features/scout/types/player.types"

type SnowyCardProps = {
  player: ListPlayer
  /** Only the card itself, without its glow and snow: the way it looks while it turns over. */
  bare?: boolean
  /** The glow fades in and the snow drops onto the card, as when it has just turned over. */
  reveal?: boolean
  ref?: Ref<HTMLElement>
}

/**
 * The season's card: the New Year face with frosted corners, a glow in the tier's colours and snow
 * settled on its top edge. The snow sits outside the captured card, so downloads stay clean.
 */
export function SnowyCard({ player, bare = false, reveal = false, ref }: SnowyCardProps) {
  return (
    <div data-rarity={player.rarity} className="relative flex w-full max-w-80 justify-center">
      {bare ? null : (
        // Narrow sideways: the page clips anything wider than its 16–24px gutter.
        <div
          aria-hidden
          className={cn(
            "scout-card-glow pointer-events-none absolute -inset-x-3 -inset-y-10",
            reveal && "season-card-glow-in"
          )}
        />
      )}
      <div className="card-lift relative">
        <div className="season-frost relative">
          <PlayerCard player={player} ref={ref} occasion="new-year" />
        </div>
        {bare ? null : (
          <SnowCap
            className={cn(
              "pointer-events-none absolute -top-3 -right-1.5 -left-1.5 h-10 w-[calc(100%+0.75rem)]",
              reveal && "season-snow-cap"
            )}
          />
        )}
      </div>
    </div>
  )
}
