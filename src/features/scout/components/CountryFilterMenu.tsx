import { Globe } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { UNKNOWN_COUNTRY } from "@/features/scout/constants/player-country.constants"
import { parseCountry } from "@/features/scout/helpers/filter-params"
import { countryName, sortCountryCounts } from "@/features/scout/helpers/player-country"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import type { LeaderboardFacets } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** Radyo grubunda "hepsi" seçeneğinin değeri; filtreyi kaldırır. */
const ALL = "all"

type CountryFilterMenuProps = {
  facets: Pick<LeaderboardFacets, "countries" | "unknownCountry" | "total">
}

/**
 * Ülke listesi uzayabileceği için mevki ve kart filtresinden ayrı bir menü.
 * Ülkeler kalabalıktan aza sıralanır, ülkesi bilinmeyenler en altta "Belirsiz" olarak durur.
 */
export function CountryFilterMenu({ facets }: CountryFilterMenuProps) {
  const { filters, setFilters } = useLeaderboardSearch()
  const countries = sortCountryCounts(facets.countries)
  const unknown = facets.unknownCountry
  const selected = filters.country
  const SelectedFlag =
    selected && selected !== UNKNOWN_COUNTRY ? COUNTRY_FLAGS[selected] : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m.filter_country()}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {selected && SelectedFlag && selected !== UNKNOWN_COUNTRY ? (
          <>
            <SelectedFlag aria-hidden className={FLAG_CLASS} />
            {countryName(selected)}
          </>
        ) : (
          <>
            <Globe aria-hidden />
            {selected === UNKNOWN_COUNTRY ? m.country_unknown() : m.filter_country()}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-auto min-w-56 overscroll-contain">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.filter_country()}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={selected ?? ALL}
            onValueChange={(value) => setFilters({ country: parseCountry(String(value)) })}
          >
            <DropdownMenuRadioItem value={ALL}>
              {m.filter_all_countries()}
              <Count value={facets.total} />
            </DropdownMenuRadioItem>
            {countries.map(({ country, count }) => {
              const Flag = COUNTRY_FLAGS[country]
              return (
                <DropdownMenuRadioItem key={country} value={country}>
                  <Flag aria-hidden className={FLAG_CLASS} />
                  <span className="whitespace-nowrap">{countryName(country)}</span>
                  <Count value={count} />
                </DropdownMenuRadioItem>
              )
            })}
            {unknown > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value={UNKNOWN_COUNTRY}>
                  {m.country_unknown()}
                  <Count value={unknown} />
                </DropdownMenuRadioItem>
              </>
            ) : null}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Count({ value }: { value: number }) {
  return (
    <span className="ms-auto ps-3 font-mono text-xs text-muted-foreground tabular-nums">
      {value}
    </span>
  )
}
