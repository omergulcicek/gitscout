import { useState } from "react"

import { Button } from "@/components/ui/button"
import { BadgeIcon } from "@/features/scout/components/BadgeIcon"
import { badgeDetail, badgeName } from "@/features/scout/helpers/player-text"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** İlk bakışta görünen rozet sayısı; gerisi tek tıkla açılır. */
const VISIBLE_COUNT = 6

type BadgeListProps = {
  badges: ScoredPlayer["badges"]
}

export function BadgeList({ badges }: BadgeListProps) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? badges : badges.slice(0, VISIBLE_COUNT)
  const hiddenCount = badges.length - VISIBLE_COUNT

  return (
    <section className="flex flex-col gap-4" aria-labelledby="badges-heading">
      <h2 id="badges-heading" className="text-lg font-semibold">
        {m.badges_heading()}
      </h2>
      {badges.length === 0 ? (
        <p className="surface px-4 py-6 text-center text-sm text-balance text-muted-foreground">
          {m.badges_empty()}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((badge) => (
            <li key={badge.id} className="surface flex items-start gap-3 p-3">
              <span
                data-badge={badge.id}
                className="badge-tint grid size-9 shrink-0 place-items-center rounded-md"
              >
                <BadgeIcon id={badge.id} className="size-4.5" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-medium">{badgeName(badge.id)}</p>
                <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
                  {badgeDetail(badge)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {hiddenCount > 0 ? (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? m.badges_show_less() : m.badges_show_all({ count: hiddenCount })}
        </Button>
      ) : null}
    </section>
  )
}
