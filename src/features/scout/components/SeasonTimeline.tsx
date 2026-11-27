import { cn } from "cn"

import { SEASON_TIMELINE } from "@/features/scout/constants/season.constants"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

const stepDate = (date: string) =>
  new Intl.DateTimeFormat(getLocale(), { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  )

/** Stands in for the date while the sentence is built, so the date can be set in bold around it. */
const DATE_SLOT = "\u0000"

/** A step's sentence with its date in bold, wherever the language puts the date. */
function StepText({ text, date }: { text: (inputs: { date: string }) => string; date: string }) {
  const [before, after = ""] = text({ date: DATE_SLOT }).split(DATE_SLOT)
  return (
    <>
      {before}
      <strong className="font-semibold text-foreground">{date}</strong>
      {after}
    </>
  )
}

/** Index of the phase in progress: the last one that has started. Notes without a start never count. */
function currentStep(now: Date): number {
  const today = now.toISOString().slice(0, 10)
  return SEASON_TIMELINE.reduce(
    (current, step, index) => (step.from && step.from <= today ? index : current),
    0
  )
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
            key={step.title()}
            aria-current={index === current ? "step" : undefined}
            className={cn(
              "surface season-ice flex flex-col gap-1.5 p-4",
              index < current && "opacity-60",
              index === current && "ring-2 ring-chart-home"
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold">{step.title()}</span>
              {index === current ? (
                <span className="shrink-0 rounded-full bg-chart-home px-2 py-0.5 text-[10px] font-semibold text-white">
                  {m.season_timeline_now()}
                </span>
              ) : null}
            </span>
            <span className="text-sm text-muted-foreground">
              {step.date ? (
                <StepText text={step.text} date={stepDate(step.date)} />
              ) : (
                step.text({ date: "" })
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
