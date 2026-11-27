import { Link } from "@tanstack/react-router"
import { Snowflake } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { buttonVariants } from "@/components/ui/button"
import { SEASON_YEAR } from "@/features/scout/helpers/season"
import * as m from "@/paraglide/messages.js"

type SeasonLinksProps = {
  login: string
  /** Years with a frozen season, newest first. */
  seasons: number[]
}

/**
 * The current season's report, then every frozen past season. A past season opens its own year, which
 * shows the card as it stood when that season closed.
 */
export function SeasonLinks({ login, seasons }: SeasonLinksProps) {
  const lang = getLangParam()
  const past = seasons.filter((year) => year !== SEASON_YEAR)

  return (
    <nav aria-label={m.season_links_label()} className="flex flex-col items-center gap-1.5">
      <Link
        to="/{-$lang}/u/$username/season"
        params={{ lang, username: login }}
        search={{}}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Snowflake aria-hidden />
        {m.season_link({ year: SEASON_YEAR })}
      </Link>
      {past.length > 0 ? (
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground">
          <span>{m.season_past()}</span>
          {past.map((year) => (
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
        </p>
      ) : null}
    </nav>
  )
}
