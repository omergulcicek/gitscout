import type { KeyboardEvent } from "react"

import { Link } from "@tanstack/react-router"
import { ArrowRight, ChevronLeft, ChevronRight, IdCard } from "lucide-react"

import { TEAMS } from "@/constants/team.constants"

import { getLangParam } from "@/helpers/localized-url"

import { Button } from "@/components/ui/button"
import { CARD_OCCASIONS } from "@/features/scout/constants/card-occasion.constants"
import { TeamCrest } from "@/features/scout/icons/TeamCrest"
import type { CardOccasion } from "@/features/scout/types/card-preview.types"
import * as m from "@/paraglide/messages.js"

type CardOccasionPickerProps = {
  /** Gösterilen özel kart; `null` gerçek kart. */
  value: CardOccasion | null
  /** Kişiye uyan özel kartlar; uymayan seçenek hiç gösterilmez. */
  options: readonly CardOccasion[]
  onChange: (occasion: CardOccasion | null) => void
}

/** Kart önizlemesinin altındaki seçici: oklarla gerçek kart ve kişiye uyan özel günler arasında gezinir. Yalnızca önizleme. */
export function CardOccasionPicker({ value, options, onChange }: CardOccasionPickerProps) {
  const items = [
    { key: "real", occasion: null, icon: IdCard, label: m.occasion_real },
    ...options.map((occasion) => ({
      key: occasion,
      occasion,
      icon: CARD_OCCASIONS[occasion].icon,
      label: CARD_OCCASIONS[occasion].chip
    }))
  ]

  const index = Math.max(
    0,
    items.findIndex((item) => item.occasion === value)
  )
  const selected = items[index] ?? items[0]
  // Takım kartının simgesi genel kalkan yerine takımın kendi arması.
  const team = TEAMS.find((item) => item === selected?.occasion)
  const Icon = selected?.icon ?? IdCard

  // Uçlarda başa ya da sona döner; böylece iki ok da hiç pasif kalmaz.
  const step = (direction: 1 | -1) => {
    const next = items[(index + direction + items.length) % items.length]
    if (next) onChange(next.occasion)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") step(-1)
    else if (event.key === "ArrowRight") step(1)
    else return
    event.preventDefault()
  }

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2">
      <div
        role="group"
        aria-label={m.card_preview_label()}
        className="flex w-full items-center justify-between gap-3"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={m.card_preview_prev()}
          onClick={() => step(-1)}
          onKeyDown={handleKeyDown}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <div aria-live="polite" className="flex min-w-0 flex-col items-center gap-0.5">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            {team ? (
              <TeamCrest team={team} adaptive className="size-4 shrink-0" />
            ) : (
              <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{selected?.label()}</span>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {m.card_preview_position({ current: index + 1, total: items.length })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={m.card_preview_next()}
          onClick={() => step(1)}
          onKeyDown={handleKeyDown}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
      <Link
        to="/{-$lang}/special-cards"
        params={{ lang: getLangParam() }}
        className="group inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {m.special_cards_all()}
        <ArrowRight
          aria-hidden
          className="size-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </div>
  )
}
