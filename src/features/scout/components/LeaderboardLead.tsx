import { Fragment } from "react"

import { REFRESH } from "@/features/scout/constants/scoring.constants"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { RARITIES } from "@/features/scout/schemas/leaderboard-search.schema"
import type { LeaderboardFacets } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/**
 * Liderlik tablosunun üstündeki tek cümlelik özet: toplam geliştirici ve kart türü dağılımı.
 * Her sayının önünde o kart türünün renginde küçük bir kutu durur; "ve" gibi bağlaçlar dile göre gelir.
 */
type LeaderboardLeadProps = Pick<LeaderboardFacets, "total" | "rarityCounts">

export function LeaderboardLead({ total, rarityCounts }: LeaderboardLeadProps) {
  const items = RARITIES.map((rarity) => ({ rarity, count: rarityCounts[rarity] }))
  const parts = new Intl.ListFormat(getLocale(), { type: "conjunction" }).formatToParts(
    items.map((item) => item.rarity)
  )
  let index = 0

  return (
    <p className="max-w-prose font-mono text-sm text-pretty text-muted-foreground">
      {m.leaderboard_lead_intro({ total })}
      <br />
      {parts.map((part) => {
        if (part.type === "literal") return <Fragment key={`lit-${index}`}>{part.value}</Fragment>
        const item = items[index++]
        if (!item) return null
        return (
          <span key={item.rarity} className="whitespace-nowrap text-foreground">
            <span
              aria-hidden
              data-rarity={item.rarity}
              className="scout-card me-1 inline-block size-2.5 rounded-[3px] align-[-0.05em] shadow-none"
            />
            <span className="font-mono">{item.count}</span> {rarityLabel(item.rarity)}
          </span>
        )
      })}{" "}
      {m.leaderboard_lead_cards()} {m.leaderboard_lead_refresh({ days: REFRESH.maxAgeDays })}
    </p>
  )
}
