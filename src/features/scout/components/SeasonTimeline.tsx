import { cn } from "cn"

import { SEASON_TIMELINE } from "@/features/scout/constants/season.constants"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

const stepDate = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  )

/** Index of the step in progress: the last one that has started. */
function currentStep(now: Date): number {
  const today = now.toISOString().slice(0, 10)
  return SEASON_TIMELINE.reduce((current, step, index) => (step.from <= today ? index : current), 0)
}

type SeasonTimelineProps = {
  /** Passed in so the server and the browser agree on the step. */
  now: Date
}

/** The season's calendar, with the step in progress marked, so people know when to come back. */
export function SeasonTimeline({ now }: SeasonTimelineProps) {
  const current = currentStep(now)

  return (
    <section aria-labelledby="season-timeline-heading" className="flex flex-col gap-4">
      <h2 id="season-timeline-heading" className="text-lg font-semibold">
        {m.season_timeline_title()}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {SEASON_TIMELINE.map((step, index) => (
          <li
            key={step.from}
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "surface season-ice flex flex-col gap-1.5 p-4",
              index < current && "opacity-60",
              index === current && "ring-2 ring-chart-home"
            )}
          >
            <span className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
              {stepDate(step.from)}
              {index === current ? (
                <span className="rounded-full bg-chart-home px-2 py-0.5 text-[10px] font-semibold text-white">
                  {m.season_timeline_now()}
                </span>
              ) : null}
            </span>
            <span className="font-semibold">{step.title()}</span>
            <span className="text-sm text-muted-foreground">{step.text()}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
