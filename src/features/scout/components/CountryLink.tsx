import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { countryName, playerCountry } from "@/features/scout/helpers/player-country"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** The player's country as a small link to the leaderboard filtered to it; nothing when it's unknown. */
export function CountryLink({
  player
}: {
  player: Pick<ListPlayer, "login" | "country" | "claimedCountry">
}) {
  const country = playerCountry(player)
  if (!country) return null
  const Flag = COUNTRY_FLAGS[country]
  const name = countryName(country)

  return (
    <Link
      to="/{-$lang}/leaderboard"
      params={{ lang: getLangParam() }}
      search={{ country: country.toLowerCase() }}
      aria-label={m.country_leaderboard({ country: name })}
      className="inline-flex min-h-6 items-center gap-1.5 rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Flag aria-hidden className={FLAG_CLASS} />
      {name}
    </Link>
  )
}
