import { cn } from "cn"

import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { STAT_TIER_TEXT } from "@/features/scout/constants/stat-tier.constants"
import { statShort, titleText } from "@/features/scout/helpers/player-text"
import { statTier } from "@/features/scout/helpers/stat-tier"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type PlayerCardMediumProps = {
  player: ListPlayer
  className?: string
}

/**
 * Tam kartın sıkıştırılmış hâli: puan, avatar, ad ve altı stat. Dar alanda iki kart yan yana
 * sığacak genişlikte (~165px) tasarlandı; README'deki orta boy rozet de aynı düzeni çizer.
 */
export function PlayerCardMedium({ player, className }: PlayerCardMediumProps) {
  return (
    <figure
      data-rarity={player.rarity}
      className={cn("scout-card flex w-full flex-col rounded-2xl p-1.5", className)}
    >
      <figcaption className="sr-only">
        {m.card_caption({
          name: player.name,
          ovr: player.ovr,
          position: player.position,
          title: titleText(player.title)
        })}
      </figcaption>

      <div className="scout-card-inner relative flex flex-1 flex-col rounded-xl px-3 pt-3 pb-2.5">
        <div
          aria-hidden
          className="scout-card-texture pointer-events-none absolute inset-0 rounded-xl"
        />

        <div aria-hidden className="relative flex items-start justify-between gap-2">
          <img
            src={player.avatarUrl}
            alt=""
            width={56}
            height={56}
            className="scout-card-avatar size-12 shrink-0 rounded-full bg-muted object-cover min-[360px]:size-14"
          />
          <div className="flex flex-col items-end">
            <span className="scout-card-accent font-mono text-3xl leading-none font-bold tracking-tighter tabular-nums min-[360px]:text-4xl">
              {player.ovr}
            </span>
            <span
              lang="en"
              className="mt-1 text-[10px] font-semibold tracking-wider uppercase min-[360px]:tracking-widest"
            >
              {player.position}
            </span>
          </div>
        </div>

        <div aria-hidden className="relative mt-2.5 flex min-w-0 flex-col">
          <span className="truncate text-sm leading-tight font-semibold">{player.name}</span>
          <span className="scout-card-muted mt-0.5 truncate text-[11px]">
            {titleText(player.title)}
          </span>
        </div>

        <div aria-hidden className="scout-card-rule relative mt-2.5 w-full border-t" />

        <dl className="relative mt-2 grid grid-cols-3 gap-x-1 gap-y-2">
          {STAT_ORDER.map((key) => {
            const value = player.stats[key].value
            return (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <dt className="scout-card-muted text-[10px] font-semibold tracking-wider">
                  {statShort(key)}
                </dt>
                <dd
                  className={cn(
                    "font-mono text-base leading-none font-bold tabular-nums",
                    STAT_TIER_TEXT[statTier(value)]
                  )}
                >
                  {value}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </figure>
  )
}
