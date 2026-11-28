import { getRouteApi, Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "cn"

import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { buttonVariants } from "@/components/ui/button"
import { CountryProgressBar } from "@/features/scout/components/CountryProgressBar"
import { InviteButton } from "@/features/scout/components/InviteButton"
import { MiniPlayerCard } from "@/features/scout/components/MiniPlayerCard"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { PlayerCardMedium } from "@/features/scout/components/PlayerCardMedium"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { serializeCountry } from "@/features/scout/helpers/filter-params"
import { countryName } from "@/features/scout/helpers/player-country"
import { number } from "@/features/scout/helpers/player-text"
import { useCountryTop } from "@/features/scout/hooks/use-country-top"
import type { CountryTop } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const routeApi = getRouteApi("/{-$lang}/top/$country")

/**
 * Cards shown big at the top; the rest are small cards with their rank. Four, so the other 96 of a full
 * top 100 fill every row at three, four, six and eight per row.
 */
const PODIUM_SIZE = 4

/** One country's page: its top 100 once it has enough developers, otherwise how close it is and an invite. */
export function CountryTopPage() {
  const { country: slug } = routeApi.useParams()
  const { data } = useCountryTop(slug)
  const Flag = COUNTRY_FLAGS[data.country]
  const name = countryName(data.country)
  const lang = getLangParam()

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <Link
        to="/{-$lang}/top"
        params={{ lang }}
        className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {m.top_back()}
      </Link>
      <div className="flex flex-col gap-10">
        <PageHeader
          align={data.unlocked ? "center" : "start"}
          eyebrow={
            <span className="inline-flex items-center gap-2">
              <Flag aria-hidden className={cn(FLAG_CLASS, "h-3.5")} />
              {name}
            </span>
          }
          title={
            data.unlocked
              ? m.top_country_title({ country: name, count: data.players.length })
              : m.top_locked_title({ country: name })
          }
        >
          {data.unlocked ? <CountryIntro data={data} /> : null}
        </PageHeader>
        {data.unlocked ? (
          <UnlockedCountry data={data} name={name} />
        ) : (
          <LockedCountry data={data} />
        )}
      </div>
    </main>
  )
}

function CountryIntro({ data }: { data: CountryTop }) {
  const counts = data.rarityCounts
  return (
    <p className="max-w-2xl font-mono text-pretty text-muted-foreground">
      {m.top_country_intro({
        count: number(data.total),
        icon: number(counts.icon),
        gold: number(counts.gold),
        silver: number(counts.silver),
        bronze: number(counts.bronze)
      })}{" "}
      {data.topPosition ? m.top_country_intro_role({ role: data.topPosition }) : null}
    </p>
  )
}

function UnlockedCountry({ data, name }: { data: CountryTop; name: string }) {
  const lang = getLangParam()
  const { data: viewer } = useViewer()
  // The podium already shows the top four big, so only cards from #5 on are marked.
  const isViewer = (login: string) => viewer?.login.toLowerCase() === login.toLowerCase()
  const podium = data.players.slice(0, PODIUM_SIZE)
  const rest = data.players.slice(PODIUM_SIZE)

  return (
    <>
      <ol
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        aria-label={m.top_podium({ count: PODIUM_SIZE })}
      >
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

      {rest.length > 0 ? (
        <ol
          start={PODIUM_SIZE + 1}
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
        >
          {rest.map((player) => {
            const mine = isViewer(player.login)
            return (
              <li
                key={player.login}
                aria-current={mine ? "true" : undefined}
                className="flex flex-col gap-1.5"
              >
                <span
                  className={cn(
                    "text-center font-mono text-[11px] font-bold tabular-nums",
                    mine ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  #{player.rank}
                </span>
                <div
                  className={cn(
                    "rounded-xl",
                    mine && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <MiniPlayerCard player={player} showFlag={false} />
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}

      <Link
        to="/{-$lang}/leaderboard"
        params={{ lang }}
        search={{ country: serializeCountry(data.country) }}
        className={buttonVariants({ variant: "outline", className: "self-center" })}
      >
        {m.top_country_full_table({ country: name, count: data.total })}
        <ArrowRight aria-hidden />
      </Link>
    </>
  )
}

function LockedCountry({ data }: { data: CountryTop }) {
  const lang = getLangParam()
  const name = countryName(data.country)
  const missing = Math.max(0, data.min - data.total)

  return (
    <>
      <section className="surface flex max-w-2xl flex-col gap-4 p-5">
        <p className="text-pretty">{m.top_locked_lead({ min: data.min, count: data.total })}</p>
        <CountryProgressBar total={data.total} min={data.min} />
        <p className="text-sm font-medium">{m.top_missing({ missing, country: name })}</p>
        <div className="flex flex-wrap gap-2">
          <InviteButton country={data.country} slug={data.slug} variant="default" />
          <Link
            to="/{-$lang}"
            params={{ lang }}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {m.top_make_card()}
          </Link>
        </div>
      </section>

      {data.players.length > 0 ? (
        <section className="flex flex-col gap-3" aria-labelledby="members-heading">
          <h2 id="members-heading" className="text-lg font-semibold">
            {m.top_locked_members()}
          </h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {data.players.map((player) => (
              <li key={player.login}>
                <MiniPlayerCard player={player} showFlag={false} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
