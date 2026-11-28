import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

import { CalendarDays, Search, Users } from "lucide-react"
import { cn } from "cn"

import { TEAM_NAMES, TEAMS } from "@/constants/team.constants"
import type { Team } from "@/constants/team.constants"
import { siteConfig } from "@/config/site.config"

import { useViewer } from "@/hooks/use-viewer"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { SampleCardWithActions } from "@/features/scout/components/SpecialCardSample"
import { CARD_OCCASIONS } from "@/features/scout/constants/card-occasion.constants"
import { FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import {
  TEAM_COUNTRY_FLAGS,
  TEAM_COUNTRY_NAMES
} from "@/features/scout/constants/team-country.constants"
import { matchesText } from "@/features/scout/helpers/search-text"
import { sortedTeamCountries, sortedTeams } from "@/features/scout/helpers/team-sort"
import { useTeamCardSearch } from "@/features/scout/hooks/use-team-card-search"
import { TeamCrest } from "@/features/scout/icons/TeamCrest"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const LINK_CLASS =
  "rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** Yeni takım talebi için GitHub'da önceden doldurulmuş bir issue açar; depo herkese açık olduğu için metin İngilizce. */
const teamRequestUrl = () => {
  const params = new URLSearchParams({
    title: "Team request: ",
    body: "Club:\nCountry:\nLogo (football-logos.cc link):\n"
  })
  return `${siteConfig.links.github}/issues/new?${params.toString()}`
}

type TeamCardShowcaseProps = {
  sample: ListPlayer
  settingsLink: ReactNode
}

/**
 * Takım kartlarının vitrini: tek örnek kart ve yanında takım seçici. Takımlar lig yerine ülkeye göre
 * gruplanır; ülkeler ve takımlar alfabetik sırayla alt alta dizilir, arama bütün ülkelerde arar.
 * Seçili takım adreste durur, bağlantı o kartı açar.
 */
export function TeamCardShowcase({ sample, settingsLink }: TeamCardShowcaseProps) {
  const { data: viewer } = useViewer()
  const { team: searchTeam, setTeam } = useTeamCardSearch()
  const team = searchTeam ?? viewer?.favoriteTeam ?? TEAMS[0]
  const [query, setQuery] = useState("")
  const sectionRef = useRef<HTMLElement>(null)
  // Yalnızca ilk açılıştaki adres okunur: paylaşılan bağlantıda takım varsa sayfa doğrudan takım kartlarına
  // kayar. Sayfadayken takım seçmek adresi değiştirir ama sayfayı kaydırmaz.
  const [linkedTeam] = useState(searchTeam)

  useEffect(() => {
    if (linkedTeam) sectionRef.current?.scrollIntoView({ block: "start" })
  }, [linkedTeam])

  const countries = sortedTeamCountries()
  const results = query.trim()
    ? countries
        .flatMap((item) => sortedTeams(item))
        .filter((item) => matchesText(TEAM_NAMES[item], query))
    : null
  const { icon: Icon, card } = CARD_OCCASIONS[team]
  const title = card()

  const pick = (next: Team) => {
    setTeam(next)
    setQuery("")
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="team-cards-heading"
      className="flex scroll-mt-6 flex-col gap-10 border-t pt-10"
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <h2 id="team-cards-heading" className="text-2xl font-semibold tracking-tight">
          {m.special_teams_title()}
        </h2>
        <p className="text-pretty text-muted-foreground">{m.special_teams_lead()}</p>
      </div>

      <div className="grid items-start gap-10 md:grid-cols-[20rem_1fr]">
        <div className="flex flex-col items-center gap-6">
          {/* Takım değişince kart yeniden kurulur: armalar süzülerek gelir. */}
          <SampleCardWithActions key={team} player={sample} occasion={team} title={title} />
          <div className="flex w-full flex-col gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Icon aria-hidden className="size-4 text-muted-foreground" />
              {title}
            </h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-start gap-2.5">
                <dt className="pt-0.5">
                  <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
                  <span className="sr-only">{m.special_cards_when()}</span>
                </dt>
                <dd className="text-pretty">{m.special_team_when()}</dd>
              </div>
              <div className="flex items-start gap-2.5">
                <dt className="pt-0.5">
                  <Users aria-hidden className="size-4 text-muted-foreground" />
                  <span className="sr-only">{m.special_cards_who()}</span>
                </dt>
                <dd className="text-pretty text-muted-foreground">
                  {m.special_team_who()} {settingsLink}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 md:sticky md:top-6">
          <InputGroup className="sm:max-w-sm">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={m.special_teams_search()}
              aria-label={m.special_teams_search()}
            />
          </InputGroup>

          {results ? (
            results.length > 0 ? (
              // Sonuçlar da ülke kutusu boyutunda: armalar aramada büyüyüp küçülmez.
              <div className="grid gap-3 sm:grid-cols-[repeat(2,max-content)]">
                <div className="rounded-xl border bg-card p-3">
                  <TeamGrid teams={results} selected={team} onPick={pick} />
                </div>
              </div>
            ) : (
              <p className="py-6 text-sm text-balance text-muted-foreground">
                {m.special_teams_no_results({ query: query.trim() })}
              </p>
            )
          ) : (
            // Ülkeler alfabetik sırayla iki sütunda; her ülke kutusunda armalar üçlü ızgarada. Alfabetik sıra
            // eşit takım sayılı ülkeleri yan yana getirir, satırlarda boşluk kalmaz. Kutucuklar sabit boyutta:
            // sağ taraf soldaki kart önizlemesinden uzun olmasın.
            <div className="grid items-start gap-3 sm:grid-cols-[repeat(2,max-content)]">
              {countries.map((item) => {
                const Flag = TEAM_COUNTRY_FLAGS[item]
                const teams = sortedTeams(item)
                return (
                  <section
                    key={item}
                    aria-labelledby={`team-country-${item}`}
                    className="flex flex-col gap-2.5 rounded-xl border bg-card p-3"
                  >
                    <h3
                      id={`team-country-${item}`}
                      className="flex items-center gap-2 text-xs font-semibold"
                    >
                      <Flag aria-hidden className={FLAG_CLASS} />
                      {TEAM_COUNTRY_NAMES[item]()}
                      <span className="font-normal text-muted-foreground tabular-nums">
                        {teams.length}
                      </span>
                    </h3>
                    <TeamGrid teams={teams} selected={team} onPick={pick} />
                  </section>
                )
              })}
            </div>
          )}

          {/* Armaların kaynağı ve eksik takım için talep yolu. */}
          <p className="text-xs text-pretty text-muted-foreground">
            {m.special_teams_logo_source()}{" "}
            <a
              href="https://football-logos.cc"
              target="_blank"
              rel="noreferrer"
              className={LINK_CLASS}
            >
              football-logos.cc
              <span className="sr-only"> {m.new_tab()}</span>
            </a>
            . {m.special_teams_missing()}{" "}
            <a href={teamRequestUrl()} target="_blank" rel="noreferrer" className={LINK_CLASS}>
              {m.special_teams_request()}
              <span className="sr-only"> {m.new_tab()}</span>
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}

type TeamGridProps = {
  teams: readonly Team[]
  selected: Team
  onPick: (team: Team) => void
}

/** Armalardan oluşan üçlü seçim ızgarası; ad yalnızca etikette ve üzerine gelince görünür. */
function TeamGrid({ teams, selected, onPick }: TeamGridProps) {
  return (
    <ul
      aria-label={m.special_teams_pick()}
      className="grid grid-cols-[repeat(3,--spacing(16))] gap-2"
    >
      {teams.map((item) => (
        <li key={item}>
          <button
            type="button"
            aria-pressed={item === selected}
            aria-label={TEAM_NAMES[item]}
            title={TEAM_NAMES[item]}
            onClick={() => onPick(item)}
            className={cn(
              "grid size-16 place-items-center rounded-lg border border-transparent p-2 transition-colors outline-none hover:bg-muted",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-background"
            )}
          >
            <TeamCrest team={item} adaptive className="size-full" />
          </button>
        </li>
      ))}
    </ul>
  )
}
