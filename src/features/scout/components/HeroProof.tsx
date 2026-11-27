import { cn } from "cn"

import { COUNTRY_FLAGS } from "@/features/scout/constants/country-flag.constants"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { countryName } from "@/features/scout/helpers/player-country"
import * as m from "@/paraglide/messages.js"

const PHONE_FLAGS = 3

type HeroProofProps = {
  countries: { top: CountryCode[]; total: number }
  /** Everyone on the leaderboard. */
  total: number
  lastDayCount: number
}

/**
 * The proof line under the hero: flags of the most common countries and the counts. Flags rather than
 * avatars, because the "recently added" strip right below already shows the newest faces.
 */
export function HeroProof({ countries, total, lastDayCount }: HeroProofProps) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {countries.top.length > 0 ? (
        <ul className="flex shrink-0 -space-x-1.5">
          {countries.top.map((country, index) => {
            const Flag = COUNTRY_FLAGS[country]
            return (
              <li
                key={country}
                // Phones show three flags so the line fits on one row.
                className={cn(
                  "flex size-7 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-background",
                  index >= PHONE_FLAGS && "max-sm:hidden"
                )}
              >
                {/* 3:2 flags are cropped to a circle from the middle, so the emblem stays visible. */}
                <Flag
                  role="img"
                  aria-label={countryName(country)}
                  className="h-full w-auto max-w-none shrink-0"
                />
              </li>
            )
          })}
        </ul>
      ) : null}
      <p className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-success ring-3 ring-success/20"
        />
        <span>
          {m.home_proof_total({ count: total })}
          {countries.total > 0 ? (
            <span className="whitespace-nowrap">
              {" "}
              · {m.home_proof_countries({ count: countries.total })}
            </span>
          ) : null}
          {/* Phones drop the daily count to keep one line; the "Recently added" heading repeats it. */}
          {lastDayCount > 0 ? (
            <span className="hidden sm:inline"> · {m.home_proof_day({ count: lastDayCount })}</span>
          ) : null}
        </span>
      </p>
    </div>
  )
}
