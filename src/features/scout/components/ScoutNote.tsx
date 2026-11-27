import { ArrowUpRight, Check } from "lucide-react"

import { archetypeNote } from "@/features/scout/helpers/player-text"
import type { Archetype, Stat, StatKey } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type ScoutNoteProps = {
  archetype: Archetype
  stats: Record<StatKey, Stat>
}

/** Grafiğin sözlü özeti: güçlü yönler sayılarıyla, ardından tavsiyeler; toplam üç madde. */
export function ScoutNote({ archetype, stats }: ScoutNoteProps) {
  const { strengths, growth } = archetypeNote(archetype, stats)
  if (strengths.length === 0 && growth.length === 0) return null

  return (
    <div className="flex min-w-0 flex-col gap-2 text-sm">
      <p className="shrink-0 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {m.archetype_note()}
      </p>
      <ul className="flex flex-col gap-1.5">
        {strengths.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-chart-home" />
            {text}
          </li>
        ))}
        {growth.map((text) => (
          <li key={text} className="flex items-start gap-2 text-muted-foreground">
            <ArrowUpRight aria-hidden className="mt-0.5 size-4 shrink-0" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
