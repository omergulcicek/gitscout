import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import * as m from "@/paraglide/messages.js"

type SeasonLinksProps = {
  login: string
  /** Years with a frozen season, newest first. */
  seasons: number[]
}

/**
 * Links to the player's frozen seasons; nothing until the first season closes. Each opens its own year,
 * with the card as it stood when that season closed.
 */
export function SeasonLinks({ login, seasons }: SeasonLinksProps) {
  const lang = getLangParam()
  if (seasons.length === 0) return null

  return (
    <nav
      aria-label={m.season_links_label()}
      className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground"
    >
      <span>{m.season_past()}</span>
      {seasons.map((year) => (
        <Link
          key={year}
          to="/{-$lang}/u/$username/season"
          params={{ lang, username: login }}
          search={{ year }}
          className="rounded-sm font-mono underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {year}
        </Link>
      ))}
    </nav>
  )
}
