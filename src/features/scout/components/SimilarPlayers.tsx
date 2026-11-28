import { Link } from "@tanstack/react-router"
import { Swords } from "lucide-react"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { RarityChip } from "@/features/scout/components/RarityChip"
import { titleText } from "@/features/scout/helpers/player-text"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type SimilarPlayersProps = {
  /** The profile being viewed; the duel buttons put them on the home side. */
  login: string
  players: ListPlayer[]
}

/**
 * A light "where to next" row: same-position developers with the closest score. One compact line each, so
 * the profile doesn't grow by a block of cards. Phones scroll the row sideways.
 */
export function SimilarPlayers({ login, players }: SimilarPlayersProps) {
  if (players.length === 0) return null
  const lang = getLangParam()

  return (
    <section aria-labelledby="similar-heading" className="flex min-w-0 flex-col gap-3">
      <h2 id="similar-heading" className="text-lg font-semibold">
        {m.similar_title()}
      </h2>
      <ul className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {players.map((player) => (
          <li
            key={player.login}
            className="surface flex w-64 shrink-0 snap-start items-center gap-2 py-2 ps-2 pe-1.5 lg:w-auto"
          >
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang, username: player.login }}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <img
                src={avatarSrc(player.avatarUrl, 32)}
                alt=""
                width={32}
                height={32}
                loading="lazy"
                className="size-8 shrink-0 rounded-full bg-muted"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{player.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {titleText(player.title)}
                </span>
              </span>
              <RarityChip ovr={player.ovr} rarity={player.rarity} size="sm" />
            </Link>
            <Link
              to="/{-$lang}/vs/$left/$right"
              params={{ lang, left: login, right: player.login }}
              aria-label={m.similar_duel({ name: player.name })}
              title={m.similar_duel({ name: player.name })}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Swords aria-hidden className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
