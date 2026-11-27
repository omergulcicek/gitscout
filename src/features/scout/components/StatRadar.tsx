import { Card, CardContent } from "@/components/ui/card"
import { RadarSvg } from "@/features/scout/components/RadarSvg"
import type { RadarGeometry } from "@/features/scout/components/RadarSvg"
import { RADAR_ORDER } from "@/features/scout/constants/scoring.constants"
import { partLabel, statLabel, statSummary } from "@/features/scout/helpers/player-text"
import type { ScoredPlayer, Stat } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** Same layout the Recharts version had: 220px tall, radius 70% inside 36/8px margins. */
const GEOMETRY: RadarGeometry = {
  height: 220,
  outerRatio: 0.7,
  margin: { x: 36, y: 8 },
  fallbackWidth: 297
}

type StatRadarProps = {
  stats: ScoredPlayer["stats"]
}

/** Altı statın şekli: oyuncunun hangi yönde güçlü olduğunu tek bakışta gösterir. */
export function StatRadar({ stats }: StatRadarProps) {
  // Labels are read during render so they follow the current language.
  const labels = RADAR_ORDER.map((key) => statLabel(key))

  return (
    <Card className="h-full justify-center py-4">
      <CardContent className="px-0" aria-label={m.radar_label()} role="img">
        <RadarSvg
          labels={labels}
          series={[
            {
              values: RADAR_ORDER.map((key) => stats[key].value),
              color: "var(--chart-home)",
              fillOpacity: 0.35,
              dotRadius: 4
            }
          ]}
          geometry={GEOMETRY}
          className="mx-auto w-full"
          tooltip={(index) => {
            const key = RADAR_ORDER[index]
            return key ? <StatTooltip stat={stats[key]} /> : null
          }}
        />
      </CardContent>
    </Card>
  )
}

/** Puanın nereden geldiği: tek cümlelik özet ve her parçanın katkısı. */
function StatTooltip({ stat }: { stat: Stat }) {
  return (
    <div className="flex w-64 flex-col gap-2 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{statLabel(stat.key)}</span>
        <span className="font-mono text-base font-semibold">{stat.value}</span>
      </div>
      <p className="text-pretty text-muted-foreground">{statSummary(stat.summary)}</p>
      <ul className="flex flex-col gap-1.5">
        {stat.parts.map((part) => (
          <li key={part.id} className="flex flex-col gap-1">
            <span className="flex justify-between gap-2">
              <span>{partLabel(part.id)}</span>
              <span className="font-mono text-muted-foreground">
                {Math.round(part.points)}/{part.max}
              </span>
            </span>
            <span aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-chart-home"
                style={{ width: `${part.max === 0 ? 0 : (part.points / part.max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
