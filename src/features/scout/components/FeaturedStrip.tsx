import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import { PlayerCardMedium } from "@/features/scout/components/PlayerCardMedium"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** Cards in the strip; enough to swipe through without loading a dozen avatars. */
const STRIP_LIMIT = 6

/**
 * The featured cards on narrow screens, where the big card beside the hero doesn't fit: a strip right
 * under the form that scrolls sideways. Hidden on wide screens; avatars load lazily so a hidden strip
 * costs nothing there.
 */
export function FeaturedStrip({ players }: { players: ListPlayer[] }) {
  const shown = players.slice(0, STRIP_LIMIT)
  if (shown.length === 0) return null

  return (
    <section aria-labelledby="featured-strip-heading" className="flex flex-col gap-2 lg:hidden">
      <h2 id="featured-strip-heading" className="text-xs text-muted-foreground">
        {m.featured_strip_label()}
      </h2>
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {shown.map((player, index) => (
          <li key={player.login} className="w-40 shrink-0 snap-start">
            <Link
              to="/{-$lang}/u/$username"
              params={{ lang: getLangParam(), username: player.login }}
              aria-label={m.duel_open_card({ name: player.name })}
              className="card-lift block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {/* The first two are on screen right away on a phone; the rest wait for a swipe. */}
              <PlayerCardMedium player={player} imageLoading={index < 2 ? "eager" : "lazy"} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
