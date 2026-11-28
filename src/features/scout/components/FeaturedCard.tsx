import { useState } from "react"

import { Link } from "@tanstack/react-router"
import { Shuffle } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { Button } from "@/components/ui/button"
import { CardTilt } from "@/features/scout/components/CardTilt"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type FeaturedCardProps = {
  /** The hour's card first, in the server's featured order. */
  players: ListPlayer[]
}

/**
 * Ana sayfa vitrini: saatin kartı, Gold ve üstü kartlardan seçilir. "Başka kart" sıradaki
 * kartı yalnızca tarayıcıda açar; sunucuda çizilen ilk kart her zaman saatin kartıdır.
 */
export function FeaturedCard({ players }: FeaturedCardProps) {
  const [offset, setOffset] = useState(0)
  const player = players[offset % Math.max(players.length, 1)]
  if (!player) return null

  return (
    // Same card and "Another card" button on phones; there it sits under the hero, centered.
    <div className="mx-auto flex w-full max-w-80 flex-col gap-3 lg:mx-0 lg:w-80">
      <Link
        to="/{-$lang}/u/$username"
        params={{ lang: getLangParam(), username: player.login }}
        aria-label={m.duel_open_card({ name: player.name })}
        className="card-lift rounded-[28px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {/* `key` her değişimde animasyonu yeniden başlatır; ilk yüklemede animasyon yok, LCP etkilenmez. */}
        <div key={offset} className={offset > 0 ? "card-swap" : undefined}>
          <CardTilt>
            <PlayerCard player={player} />
          </CardTilt>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {offset === 0 ? m.featured_label() : m.featured_label_next({ name: player.name })}
        </p>
        {players.length > 1 ? (
          <Button variant="ghost" size="sm" onClick={() => setOffset((value) => value + 1)}>
            <Shuffle aria-hidden />
            {m.featured_next()}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
