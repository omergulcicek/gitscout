import { useEffect, useState } from "react"

type EasedCountOptions = {
  /** Wait before counting starts. */
  delay: number
  /** Time from 0 to the target. */
  duration: number
}

/** Slow at first, then faster and faster: the number "winds up" before landing. */
const easeIn = (t: number) => t * t

/**
 * Counts from 0 to `target` along an ease-in curve, one frame at a time. With `target` 0 nothing runs,
 * so callers can disable it without a conditional hook. Reduced motion shows the target right away.
 */
export function useEasedCount(target: number, { delay, duration }: EasedCountOptions): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) return
    // Reduced motion: no wait and no count, the number lands on the first frame.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const wait = reduce ? 0 : delay
    const length = reduce ? 0 : duration
    let frame = 0
    let start = 0
    const tick = (now: number) => {
      start ||= now
      const progress = length === 0 ? 1 : Math.min(1, (now - start) / length)
      setValue(Math.round(easeIn(progress) * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick)
    }, wait)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [target, delay, duration])

  return value
}
