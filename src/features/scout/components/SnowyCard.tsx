import type { Ref } from "react"

import { cn } from "cn"

import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { SnowCap } from "@/features/scout/icons/SnowCap"
import type { ListPlayer, Rarity } from "@/features/scout/types/player.types"

/** How far the card has been put together while a season pack opens; "done" is the finished card. */
export type CardBuild = "rise" | "flag" | "position" | "count" | "tier" | "done"

type SnowyCardProps = {
  player: ListPlayer
  /** Set while a pack opens: the card's parts land one by one (see `.season-build` in the styles). */
  build?: CardBuild
  /** The tier colour of the glow while the rating climbs; the card's own tier otherwise. */
  glow?: Rarity
  ref?: Ref<HTMLElement>
}

/**
 * The season's card: the New Year face with frosted corners, a glow in the tier's colours and snow
 * settled on its top edge. The snow sits outside the captured card, so downloads stay clean.
 */
export function SnowyCard({ player, build, glow, ref }: SnowyCardProps) {
  const settled = build === undefined || build === "tier" || build === "done"
  return (
    <div
      data-rarity={glow ?? player.rarity}
      data-build={build}
      className={cn("relative flex w-full max-w-80 justify-center", build && "season-build")}
    >
      {/* Narrow sideways: the page clips anything wider than its 16–24px gutter. */}
      <div
        aria-hidden
        className="scout-card-glow season-card-glow pointer-events-none absolute -inset-x-3 -inset-y-10"
      />
      {build ? (
        <div
          aria-hidden
          className="season-card-flash pointer-events-none absolute -inset-x-3 -inset-y-16"
        />
      ) : null}
      <div className="card-lift relative">
        <div className="season-frost relative">
          <PlayerCard player={player} ref={ref} occasion="new-year" />
        </div>
        {settled ? (
          <SnowCap
            className={cn(
              "pointer-events-none absolute -top-3 -right-1.5 -left-1.5 h-10 w-[calc(100%+0.75rem)]",
              build && "season-snow-cap"
            )}
          />
        ) : null}
      </div>
    </div>
  )
}
