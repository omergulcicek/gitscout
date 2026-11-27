import { cn } from "cn"

import { rarityLabel } from "@/features/scout/helpers/player-text"
import { rarityRange } from "@/features/scout/helpers/rarity-range"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import { RARITIES } from "@/features/scout/schemas/leaderboard-search.schema"
import type { LeaderboardFacets, Rarity } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const CHIP =
  "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
const IDLE =
  "bg-transparent text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground"
const ACTIVE = "bg-foreground text-background"

/**
 * Kart türü en çok kullanılan filtre; menüde değil, tek tıkla seçilen çipler olarak durur.
 * Tek seçim: seçili çipe yeniden basmak filtreyi kaldırır. Yalnızca tabloda bulunan türler çıkar.
 */
export function RarityFilterChips({ counts }: { counts: LeaderboardFacets["rarityCounts"] }) {
  const { filters, setFilters } = useLeaderboardSearch()
  const rarities = RARITIES.filter((rarity) => counts[rarity] > 0)
  const selected = filters.rarities[0]

  const select = (rarity: Rarity | undefined) =>
    setFilters({ rarities: rarity && rarity !== selected ? [rarity] : [] })

  return (
    <div role="group" aria-label={m.filter_card()} className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-pressed={selected === undefined}
        onClick={() => select(undefined)}
        className={cn(CHIP, selected === undefined ? ACTIVE : IDLE)}
      >
        {m.filter_all_cards_short()}
      </button>
      {rarities.map((rarity) => (
        <button
          key={rarity}
          type="button"
          aria-pressed={selected === rarity}
          title={rarityRange(rarity)}
          onClick={() => select(rarity)}
          className={cn(CHIP, selected === rarity ? ACTIVE : IDLE)}
        >
          <span aria-hidden data-rarity={rarity} className="rarity-dot size-2.5 rounded-full" />
          {rarityLabel(rarity)}
        </button>
      ))}
    </div>
  )
}
