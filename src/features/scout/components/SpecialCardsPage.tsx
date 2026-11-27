import type { ReactNode } from "react"

import { Link } from "@tanstack/react-router"
import { CalendarDays, Users } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { useViewer } from "@/hooks/use-viewer"

import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { SampleCardWithActions } from "@/features/scout/components/SpecialCardSample"
import { TeamCardShowcase } from "@/features/scout/components/TeamCardShowcase"
import { CARD_OCCASIONS } from "@/features/scout/constants/card-occasion.constants"
import { GITHUB_STARS } from "@/features/scout/constants/github-star.constants"
import { nextProgrammersDay } from "@/features/scout/helpers/programmers-day"
import { usePlayersByLogin } from "@/features/scout/hooks/use-players-by-login"
import { useSpecialCardsSample } from "@/features/scout/hooks/use-special-cards-sample"
import type { CardOccasion } from "@/features/scout/types/card-preview.types"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type OccasionInfo = {
  occasion: CardOccasion
  when: string
  who: ReactNode
  /** Henüz profillerde çıkmayan kart; yalnızca ayarlarda önizlenebilir. */
  soon?: boolean
}

/** Kişiye özel kart önce, sonra dünyada ve Türkiye'de en çok ilgi çekeceklerden aza. Mesajlar render sırasında okunur, dil değişince güncellenir. */
function occasionInfos(settingsLink: ReactNode): OccasionInfo[] {
  const programmersDate = new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "long",
    timeZone: "UTC"
  }).format(nextProgrammersDay(new Date()))

  return [
    {
      occasion: "birthday",
      when: m.special_birthday_when(),
      who: (
        <>
          {m.special_birthday_who()} {settingsLink}
        </>
      )
    },
    {
      occasion: "github-star",
      when: m.special_github_star_when(),
      who: m.special_github_star_who({ count: GITHUB_STARS.size })
    },
    {
      occasion: "new-year",
      when: m.special_new_year_when(),
      who: m.special_new_year_who()
    },
    {
      occasion: "programmers-day",
      when: m.special_programmers_when({ date: programmersDate }),
      who: m.special_programmers_who()
    },
    {
      occasion: "halloween",
      when: m.special_halloween_when(),
      who: m.special_halloween_who()
    },
    {
      occasion: "republic-day",
      when: m.special_republic_when(),
      who: m.special_republic_who()
    },
    {
      occasion: "womens-day",
      when: m.special_womens_when(),
      who: (
        <>
          {m.special_womens_who()} {settingsLink}
        </>
      ),
      soon: true
    }
  ]
}

/**
 * Belirli günlerde kartın dönüştüğü kutlama kartlarının vitrini. Örnek kart, giriş yapan kişinin
 * listedeki kendi kartıdır; yoksa sitenin sahibinin kartı, o da yoksa sıralamanın birincisi.
 * Puanlar ve sıralama hiçbir kartta değişmez.
 */
export function SpecialCardsPage() {
  const lang = getLangParam()
  const { data: fallback } = useSpecialCardsSample()
  const { data: viewer } = useViewer()
  // The viewer's own card loads in the browser only; the server-rendered page stays the same for everyone.
  const { data: ownCards } = usePlayersByLogin(viewer ? [viewer.login] : [])
  const own = ownCards?.[0]
  const sample = own ?? fallback ?? undefined

  const settingsLink = (
    <Link
      to="/{-$lang}/settings"
      params={{ lang }}
      className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {m.special_cards_settings_link()}
    </Link>
  )

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      {/* Üç sütunlu kart ızgarası 5xl'a sığmadığı için sayfa geniş; başlık yine logoyla aynı hizada. */}
      <div className="mx-auto w-full max-w-5xl">
        <PageHeader title={m.special_cards_title()} className="max-w-3xl">
          <p className="font-mono text-pretty text-muted-foreground">{m.special_cards_lead()}</p>
          {sample ? (
            <p className="text-sm text-muted-foreground">
              {own ? m.special_cards_sample_own() : m.special_cards_sample({ name: sample.name })}
            </p>
          ) : null}
        </PageHeader>
      </div>

      <ul className={GRID_CLASS}>
        {occasionInfos(settingsLink).map((info) => (
          <OccasionItem key={info.occasion} info={info} sample={sample} />
        ))}
      </ul>

      {/* Takım kartları bir güne bağlı değil; kutlama kartlarından ayrı, en altta. */}
      {sample ? <TeamCardShowcase sample={sample} settingsLink={settingsLink} /> : null}
    </main>
  )
}

const GRID_CLASS = "grid justify-items-center gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3"

type OccasionItemProps = {
  info: OccasionInfo
  sample: ListPlayer | undefined
}

/** Vitrindeki tek özel kart: örnek kart, adı, ne zaman ve kime çıktığı. */
function OccasionItem({ info: { occasion, when, who, soon }, sample }: OccasionItemProps) {
  const { icon: Icon, card } = CARD_OCCASIONS[occasion]
  const title = card()
  return (
    <li className="flex w-full max-w-80 flex-col items-center gap-6">
      {sample ? <SampleCardWithActions player={sample} occasion={occasion} title={title} /> : null}
      <div className="flex w-full flex-col gap-3">
        <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          {title}
          {soon ? <Badge variant="secondary">{m.special_cards_soon()}</Badge> : null}
        </h2>
        {/* Etiket sütunu yerine simgeli satırlar: dar sütunda etiket kırılmaz. */}
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-2.5">
            <dt className="pt-0.5">
              <CalendarDays aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">{m.special_cards_when()}</span>
            </dt>
            <dd className="text-pretty">{when}</dd>
          </div>
          <div className="flex items-start gap-2.5">
            <dt className="pt-0.5">
              <Users aria-hidden className="size-4 text-muted-foreground" />
              <span className="sr-only">{m.special_cards_who()}</span>
            </dt>
            <dd className="text-pretty text-muted-foreground">{who}</dd>
          </div>
        </dl>
      </div>
    </li>
  )
}
