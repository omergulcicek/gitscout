import type { ReactNode } from "react"

import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import * as m from "@/paraglide/messages.js"

/** A panel with the same frame and padding as the season page's `surface` panels. */
function Block({ className, children }: { className?: string; children?: ReactNode }) {
  return <div className={cn("surface flex flex-col gap-4 p-4", className)}>{children}</div>
}

/** A title with an optional caption on the right, as on the chart panels. */
function BlockHeading({ caption = false }: { caption?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <Skeleton className="h-4 w-28" />
      {caption ? <Skeleton className="h-3 w-40 max-sm:hidden" /> : null}
    </div>
  )
}

/** Bars of varying height standing in for a chart. */
function Bars({ count, className }: { count: number; className: string }) {
  return (
    <div className={cn("flex items-end gap-0.5", className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-b-none"
          // Fixed pattern so the server and the browser draw the same bars.
          style={{ height: `${25 + ((index * 37) % 60)}%` }}
        />
      ))}
    </div>
  )
}

/**
 * Shown while a season report loads, laid out like `SeasonPage`: the sealed pack on the left; the title,
 * stats, form chart, career chart, scout report and rival on the right. Nothing shifts when it arrives.
 */
export function SeasonPageSkeleton() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-busy="true"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-x-clip px-4 pt-2 pb-20 outline-none sm:px-6"
    >
      <p role="status" className="sr-only">
        {m.player_loading()}
      </p>

      <div aria-hidden className="flex flex-col gap-6">
        <Skeleton className="h-7 w-32" />

        <div className="grid gap-8 md:grid-cols-[20rem_1fr] md:items-start">
          <aside className="flex flex-col items-center gap-4">
            <Skeleton className="h-120 w-80 max-w-full rounded-[28px]" />
            <Skeleton className="h-9 w-28" />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full max-w-md" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </div>

            <Block>
              <BlockHeading />
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </Block>

            <Block>
              <BlockHeading caption />
              <Bars count={48} className="h-28" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-9 w-44" />
                <Skeleton className="h-9 w-28" />
              </div>
            </Block>

            <Block>
              <BlockHeading caption />
              <Bars count={10} className="h-36" />
            </Block>

            <Block>
              <BlockHeading />
              <div className="flex flex-col gap-2.5">
                {["w-3/4", "w-2/3", "w-1/2", "w-3/5", "w-2/3"].map((width, index) => (
                  <Skeleton key={index} className={cn("h-4", width)} />
                ))}
              </div>
            </Block>

            <Block className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-28" />
            </Block>
          </div>
        </div>
      </div>
    </main>
  )
}
