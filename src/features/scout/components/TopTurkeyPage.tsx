import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { PlayerCardMedium } from "@/features/scout/components/PlayerCardMedium"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { number } from "@/features/scout/helpers/player-text"
import { useTurkeyTop } from "@/features/scout/hooks/use-turkey-top"
import * as m from "@/paraglide/messages.js"

/** Cards shown open at the top; the rest is a plain ranked list. */
const PODIUM_SIZE = 3

/** Türkiye's top 100: a short intro with counts, the top three as cards, then a simple ranked list. */
export function TopTurkeyPage() {
  const { data } = useTurkeyTop()
  const lang = getLangParam()
  const podium = data.players.slice(0, PODIUM_SIZE)
  const rest = data.players.slice(PODIUM_SIZE)
  const counts = data.rarityCounts

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <PageHeader title={m.top_turkey_title()}>
        <p className="max-w-2xl font-mono text-pretty text-muted-foreground">
          {m.top_turkey_intro({
            count: number(data.total),
            icon: number(counts.icon),
            gold: number(counts.gold),
            silver: number(counts.silver),
            bronze: number(counts.bronze)
          })}{" "}
          {data.topPosition ? m.top_turkey_intro_role({ role: data.topPosition }) : null}
        </p>
      </PageHeader>

      <ol className="grid gap-4 sm:grid-cols-3" aria-label={m.top_turkey_podium()}>
        {podium.map((player) => (
          <li key={player.login} className="flex flex-col items-center gap-2">
            <span className="font-mono text-sm font-bold text-muted-foreground">
              #{player.rank}
            </span>
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang, username: player.login }}
              aria-label={m.duel_open_card({ name: player.name })}
              className="card-lift block w-full max-w-64 rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <PlayerCardMedium player={player} />
            </Link>
          </li>
        ))}
      </ol>

      <ol start={PODIUM_SIZE + 1} className="surface flex flex-col divide-y overflow-hidden p-0">
        {rest.map((player) => (
          <li key={player.login}>
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang, username: player.login }}
              className="flex items-center gap-3 px-4 py-2.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <span className="w-8 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">
                {player.rank}
              </span>
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
                <span className="truncate text-xs text-muted-foreground">@{player.login}</span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {player.position}
              </span>
              <RarityChip ovr={player.ovr} rarity={player.rarity} />
            </Link>
          </li>
        ))}
      </ol>

      <Link
        to="/{-$lang}/leaderboard"
        params={{ lang }}
        search={{ country: "tr" }}
        className={buttonVariants({ variant: "outline", className: "self-center" })}
      >
        {m.home_full_table_tr({ count: data.total })}
        <ArrowRight aria-hidden />
      </Link>
    </main>
  )
}
