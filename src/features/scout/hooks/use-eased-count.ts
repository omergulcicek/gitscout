import { useEffect, useState } from "react"

type EasedCountOptions = {
  /** Wait before the first step. */
  delay: number
}

/** The first steps are slow enough to read each number: 1, 2, 3… */
const FIRST_STEP_MS = 240
/** Each step is this much shorter than the one before, so the count keeps speeding up. */
const SPEED_UP = 0.93
/** The fastest a step gets; the last stretch rushes to the score at this pace. */
const LAST_STEP_MS = 12

/**
 * Time before step `index` (0-based). With these values 1→15 takes about 2s, 15→40 about 1s and the rest
 * rushes by in a few hundred milliseconds.
 */
export function stepDuration(index: number): number {
  return Math.max(LAST_STEP_MS, FIRST_STEP_MS * SPEED_UP ** index)
}

/**
 * Counts 0, 1, 2… up to `target`, slowly at first and faster with every step, so the number winds up and
 * then rushes to the score. With `target` 0 nothing runs, so callers can disable it without a conditional
 * hook. Reduced motion shows the target right away.
 */
export function useEasedCount(target: number, { delay }: EasedCountOptions): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let current = 0
    let timer = 0
    const step = () => {
      current = reduce ? target : current + 1
      setValue(current)
      if (current < target) timer = window.setTimeout(step, stepDuration(current))
    }
    timer = window.setTimeout(step, reduce ? 0 : delay)
    return () => window.clearTimeout(timer)
  }, [target, delay])

  return value
}
