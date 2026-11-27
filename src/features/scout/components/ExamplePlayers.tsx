import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** The hero's "Try:" row; the server picks the example players that already have cards. */
export function ExamplePlayers({ players }: { players: ListPlayer[] }) {
  if (players.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>{m.home_try()}</span>
      <ul className="contents">
        {players.map((player) => (
          <li key={player.login}>
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang: getLangParam(), username: player.login }}
              aria-label={m.duel_open_card({ name: player.name })}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted ps-0.5 pe-2.5 font-mono text-xs text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <img
                src={player.avatarUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-full"
              />
              {player.login}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
