import { MiniPlayerCard } from "@/features/scout/components/MiniPlayerCard"
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
        <p className="text-sm text-balance text-muted-foreground">
          {m.recent_last_day({ count: lastDayCount })}
        </p>
      </div>
      {/* Dar ekranda şerit kendi içinde kayar; geniş ekranda sekiz kart tek satıra sığar. */}
      <ul className="relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0 lg:pb-0">
        {entries.map(({ player, addedAt }) => (
          <li
            key={player.login}
            className="flex w-28 shrink-0 snap-start flex-col gap-1.5 lg:w-auto"
          >
            <MiniPlayerCard player={player} />
            <span className="text-center text-[11px] text-muted-foreground">
              {timeAgo(addedAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
