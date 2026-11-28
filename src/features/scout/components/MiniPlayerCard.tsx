import { Link } from "@tanstack/react-router"
import { Star } from "lucide-react"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { fitCardName } from "@/features/scout/helpers/card-name"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { countryName, playerCountry } from "@/features/scout/helpers/player-country"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type MiniPlayerCardProps = {
  player: ListPlayer
  /** Off where every card shares a country, such as a country page: the same flag on each adds nothing. */
  showFlag?: boolean
}

/** A small card linking to a profile, used by the card strips. */
export function MiniPlayerCard({ player, showFlag = true }: MiniPlayerCardProps) {
  const country = showFlag ? playerCountry(player) : undefined
  const Flag = country ? COUNTRY_FLAGS[country] : undefined
  return (
    <Link
      to="/{-$lang}/u/$username"
      params={{ lang: getLangParam(), username: player.login }}
      aria-label={m.duel_open_card({ name: player.name })}
      data-rarity={player.rarity}
      className="scout-card card-lift flex rounded-xl p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="scout-card-inner relative flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-3">
        {/* Avatar ortada durur; bayrak sol üst, GitHub Star yıldızı sağ üst köşedeki boşluğa yerleşir, akışı itmez. */}
        {country && Flag ? (
          <Flag
            role="img"
            aria-label={countryName(country)}
            title={countryName(country)}
            className={cn(FLAG_CLASS, "absolute top-2 left-2 h-3")}
          />
        ) : null}
        {isGithubStar(player.login) ? (
          <span
            role="img"
            aria-label={m.github_star()}
            title={m.github_star()}
            className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-black/75 ring-1 ring-white/30"
          >
            <Star aria-hidden className="size-2.5 fill-github-star text-github-star" />
          </span>
        ) : null}
        <img
          src={avatarSrc(player.avatarUrl, 48)}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          className="size-12 rounded-full bg-muted"
        />
        <span className="w-full truncate text-center text-xs font-semibold">
          {fitCardName(player.name, "mini")}
        </span>
        <span className="font-mono text-lg leading-none font-bold tabular-nums">{player.ovr}</span>
      </span>
    </Link>
  )
}
