import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { buttonVariants } from "@/components/ui/button"
import { PlayerCardMedium } from "@/features/scout/components/PlayerCardMedium"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type DreamTeamSectionProps = {
  /** Whose profile this is. */
  owner: { login: string; name: string }
  /** The owner's picks in order; empty when they haven't picked any. */
  players: ListPlayer[]
}

/**
 * The profile owner's dream team as medium cards, each opening that player's profile. With no picks the
 * section is hidden for visitors; the owner sees a prompt to build one instead.
 */
export function DreamTeamSection({ owner, players }: DreamTeamSectionProps) {
  // Who is viewing is only known in the browser; the server-rendered page is the same for everyone.
  const { data: viewer } = useViewer()
  const isOwner = viewer?.login.toLowerCase() === owner.login.toLowerCase()
  if (players.length === 0 && !isOwner) return null

  return (
    <section aria-labelledby="dream-team-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="dream-team-heading" className="text-lg font-semibold">
          {m.dream_team_title()}
        </h2>
        {players.length > 0 ? (
          <p className="text-sm text-pretty text-muted-foreground">
            {m.dream_team_lead({ name: owner.name })}
          </p>
        ) : null}
      </div>

      {players.length > 0 ? (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {players.map((player) => (
            <li key={player.login}>
              <Link
                to="/{-$lang}/u/$username"
                params={{ lang: getLangParam(), username: player.login }}
                aria-label={m.duel_open_card({ name: player.name })}
                className="card-lift block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <PlayerCardMedium player={player} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="surface flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-pretty text-muted-foreground">{m.dream_team_empty_own()}</p>
          <Link
            to="/{-$lang}/settings"
            params={{ lang: getLangParam() }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {m.dream_team_setup()}
            <ArrowRight aria-hidden />
          </Link>
        </div>
      )}
    </section>
  )
}
