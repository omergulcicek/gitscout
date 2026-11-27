import { Link } from "@tanstack/react-router"
import { Star } from "lucide-react"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { countryName, playerCountry } from "@/features/scout/helpers/player-country"
import { formatRelative } from "@/features/scout/helpers/relative-time"
import type { RecentEntry } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type RecentlyAddedProps = {
  /** Newest first; the server sends as many as the wide grid fits in one row. */
  entries: RecentEntry[]
  lastDayCount: number
  /** Göreli zamanların hesaplandığı an; sunucu ile tarayıcı aynı metni üretsin diye veriyle gelir. */
  generatedAt: string
}

/** Ana sayfada son eklenen kartlar ve sitenin ne kadar güncel olduğu. */
export function RecentlyAdded({ entries, lastDayCount, generatedAt }: RecentlyAddedProps) {
  const locale = getLocale()
  if (entries.length === 0) return null

  const timeAgo = (addedAt: string) => formatRelative(addedAt, generatedAt, locale) ?? m.just_now()

  return (
    <section className="flex flex-col gap-4" aria-labelledby="recent-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="recent-heading" className="text-xl font-semibold">
          {m.recent_title()}
        </h2>
        <p className="text-sm text-muted-foreground">
          {m.recent_last_day({ count: lastDayCount })}
        </p>
      </div>
      {/* Dar ekranda şerit kendi içinde kayar; geniş ekranda sekiz kart tek satıra sığar. */}
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0 lg:pb-0">
        {entries.map(({ player, addedAt }) => {
          const country = playerCountry(player)
          const Flag = country ? COUNTRY_FLAGS[country] : undefined
          return (
            <li
              key={player.login}
              className="flex w-28 shrink-0 snap-start flex-col gap-1.5 lg:w-auto"
            >
              <Link
                to="/{-$lang}/u/$username"
                params={{ lang: getLangParam(), username: player.login }}
                aria-label={m.duel_open_card({ name: player.name })}
                data-rarity={player.rarity}
                className="scout-card card-lift flex rounded-xl p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="scout-card-inner relative flex w-full flex-col items-center gap-1.5 rounded-lg px-2 py-3">
                  {/* Avatar ortada durur; bayrak sol üst, GitHub Star yıldızı sağ üst köşedeki boşluğa yerleşir, akışı itmez. */}
                  {country && Flag ? (
                    <Flag
                      role="img"
                      aria-label={countryName(country)}
                      title={countryName(country)}
                      className={cn(FLAG_CLASS, "absolute top-2 left-2 h-3")}
                    />
                  ) : null}
                  {isGithubStar(player.login) ? (
                    <span
                      role="img"
                      aria-label={m.github_star()}
                      title={m.github_star()}
                      className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-black/75 ring-1 ring-white/30"
                    >
                      <Star aria-hidden className="size-2.5 fill-github-star text-github-star" />
                    </span>
                  ) : null}
                  <img
                    src={avatarSrc(player.avatarUrl, 48)}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    className="size-12 rounded-full bg-muted"
                  />
                  <span className="w-full truncate text-center text-xs font-semibold">
                    {player.name}
                  </span>
                  <span className="font-mono text-lg leading-none font-bold tabular-nums">
                    {player.ovr}
                  </span>
                </span>
              </Link>
              <span className="text-center text-[11px] text-muted-foreground">
                {timeAgo(addedAt)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
