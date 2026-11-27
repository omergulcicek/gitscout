import { cn } from "cn"

import { RadarSvg } from "@/features/scout/components/RadarSvg"
import type { RadarGeometry, RadarSeries } from "@/features/scout/components/RadarSvg"
import { RADAR_ORDER } from "@/features/scout/constants/scoring.constants"
import { statLabel } from "@/features/scout/helpers/player-text"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** Same layout the Recharts version had: radius 85% inside 40/20px margins, 260px tall from `sm`, 220px below. */
const WIDE: RadarGeometry = {
  height: 260,
  outerRatio: 0.85,
  margin: { x: 40, y: 20 },
  fallbackWidth: 360
}
const NARROW: RadarGeometry = { ...WIDE, height: 220, fallbackWidth: 343 }

type DuelRadarProps = {
  left: ListPlayer
  right: ListPlayer
}

/** İki oyuncunun altı statı aynı grafikte: hangi yönde kimin üstün olduğu tek bakışta. */
export function DuelRadar({ left, right }: DuelRadarProps) {
  const labels = RADAR_ORDER.map((key) => statLabel(key))
  const series: RadarSeries[] = [
    {
      values: RADAR_ORDER.map((key) => left.stats[key].value),
      color: "var(--chart-home)",
      fillOpacity: 0.22,
      dotRadius: 3
    },
    {
      values: RADAR_ORDER.map((key) => right.stats[key].value),
      color: "var(--chart-away)",
      fillOpacity: 0.22,
      dotRadius: 3
    }
  ]
  const tooltip = (index: number) => {
    const key = RADAR_ORDER[index]
    if (!key) return null
    const row = {
      label: statLabel(key),
      left: left.stats[key].value,
      right: right.stats[key].value
    }
    return <DuelTooltip row={row} left={left.name} right={right.name} />
  }

  return (
    <section className="surface flex flex-col gap-1 px-0 py-4" aria-label={m.duel_radar_label()}>
      {/* Lejant grafiğin dışında, normal akışta: Recharts'ın mutlak konumlu lejantı dar ekranda
          grafiğin üstüne ya da sonraki bölüme taşabiliyordu. */}
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 text-xs">
        {[
          { name: left.name, color: "bg-chart-home" },
          { name: right.name, color: "bg-chart-away" }
        ].map((item) => (
          <li key={item.color} className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-sm", item.color)} />
            <span className="truncate">{item.name}</span>
          </li>
        ))}
      </ul>
      <div role="img" aria-label={m.duel_radar_label()} className="mx-auto w-full max-w-[360px]">
        <RadarSvg
          labels={labels}
          series={series}
          geometry={NARROW}
          tooltip={tooltip}
          className="sm:hidden"
        />
        <RadarSvg
          labels={labels}
          series={series}
          geometry={WIDE}
          tooltip={tooltip}
          className="max-sm:hidden"
        />
      </div>
    </section>
  )
}

type Row = { label: string; left: number; right: number }

/** İki oyuncunun o stattaki puanı; ad ile puan arasında net boşluk, puanlar hizalı. */
function DuelTooltip({ row, left, right }: { row: Row; left: string; right: string }) {
  const lines = [
    { name: left, value: row.left, color: "bg-chart-home" },
    { name: right, value: row.right, color: "bg-chart-away" }
  ]
  return (
    <div className="flex min-w-48 flex-col gap-2 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md">
      <span className="font-medium">{row.label}</span>
      <ul className="flex flex-col gap-1.5">
        {lines.map((line) => (
          <li key={line.name} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-2 shrink-0 rounded-sm", line.color)} />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{line.name}</span>
            <span className="ps-4 font-mono font-semibold tabular-nums">{line.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
