import { useEffect, useState } from "react"

type EasedCountOptions = {
  /** Wait before the first step. */
  delay: number
}

/** The first steps are slow enough to read each number: 1, 2, 3… */
const FIRST_STEP_MS = 220
/** Each opening step is this much shorter than the one before, so the count picks up speed. */
const SPEED_UP = 0.9
/** The fastest a step gets, in the middle of the count. */
const CRUISE_STEP_MS = 24
/** The very last step; the count slows down towards it so each tier change can be seen. */
const LAST_STEP_MS = 170
/** Each step before the last is this much shorter, counting back from the score. */
const SLOW_DOWN = 0.95

/**
 * Time before step `index` (0-based) of a count to `target`: slow at first, quick through the middle and
 * slowing again near the score. For 90 that is about 1.7s to 15, silver at 3.2s, gold at 3.8s and the
 * score at 5.6s.
 */
export function stepDuration(index: number, target: number): number {
  const stepsLeft = Math.max(0, target - index - 1)
  return Math.max(
    CRUISE_STEP_MS,
    FIRST_STEP_MS * SPEED_UP ** index,
    LAST_STEP_MS * SLOW_DOWN ** stepsLeft
  )
}

/**
 * Counts 0, 1, 2… up to `target`: slowly at first, quickly through the middle and slowing again as it
 * lands on the score. With `target` 0 nothing runs, so callers can disable it without a conditional
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
      if (current < target) timer = window.setTimeout(step, stepDuration(current, target))
    }
    timer = window.setTimeout(step, reduce ? 0 : delay)
    return () => window.clearTimeout(timer)
  }, [target, delay])

  return value
}
