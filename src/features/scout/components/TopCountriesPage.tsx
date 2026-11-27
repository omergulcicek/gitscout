import { Link } from "@tanstack/react-router"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { CountryProgressBar } from "@/features/scout/components/CountryProgressBar"
import { InviteButton } from "@/features/scout/components/InviteButton"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { countryName } from "@/features/scout/helpers/player-country"
import { useTopCountries } from "@/features/scout/hooks/use-top-countries"
import * as m from "@/paraglide/messages.js"

/** Countries this close to a page get a highlighted "N to go". */
const CLOSE_MISSING = 3

/** The "top developers" hub: countries with their own page, then the ones a few developers away. */
export function TopCountriesPage() {
  const { data } = useTopCountries()
  const lang = getLangParam()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <PageHeader title={m.top_title()}>
        <p className="max-w-2xl font-mono text-pretty text-muted-foreground">
          {m.top_lead({ min: data.min })}
        </p>
      </PageHeader>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.unlocked.map(({ country, slug, total, leader }) => {
          const Flag = COUNTRY_FLAGS[country]
          return (
            <li key={country}>
              <Link
                to="/{-$lang}/top/$country"
                params={{ lang, country: slug }}
                className="surface card-lift flex flex-col gap-4 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2">
                  <Flag aria-hidden className={cn(FLAG_CLASS, "h-4")} />
                  <span className="text-lg font-semibold">{countryName(country)}</span>
                  <span className="ms-auto text-sm text-muted-foreground">
                    {m.top_count({ count: total })}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <img
                    src={avatarSrc(leader.avatarUrl, 32)}
                    alt=""
                    width={32}
                    height={32}
                    loading="lazy"
                    className="size-8 shrink-0 rounded-full bg-muted"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-xs text-muted-foreground">{m.top_leader()}</span>
                    <span className="truncate text-sm font-medium">{leader.name}</span>
                  </span>
                  <RarityChip ovr={leader.ovr} rarity={leader.rarity} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {data.upcoming.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="upcoming-heading">
          <div className="flex flex-col gap-1">
            <h2 id="upcoming-heading" className="text-xl font-semibold">
              {m.top_upcoming_title()}
            </h2>
            <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
              {m.top_upcoming_lead()}
            </p>
          </div>
          {/* Short cards keep each bar short enough to read at a glance; closest to opening first. */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming.map(({ country, slug, total, missing }) => {
              const Flag = COUNTRY_FLAGS[country]
              return (
                <li key={country} className="surface flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/{-$lang}/top/$country"
                      params={{ lang, country: slug }}
                      className="flex min-w-0 items-center gap-2 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <Flag aria-hidden className={cn(FLAG_CLASS, "h-3.5")} />
                      <span className="truncate">{countryName(country)}</span>
                    </Link>
                    <span
                      className={cn(
                        "ms-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                        missing <= CLOSE_MISSING
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.top_missing_short({ missing })}
                    </span>
                  </div>
                  <CountryProgressBar total={total} min={data.min} />
                  <InviteButton country={country} slug={slug} className="w-full" />
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
