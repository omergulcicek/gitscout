import { useSyncExternalStore } from "react"

import Snowfall from "react-snowfall"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches
// The server can't know; it renders no snow and the browser starts it after hydration.
const serverSnapshot = () => true

type SeasonSnowProps = {
  /** Flakes on screen; changing it adds or removes flakes without restarting the fall. */
  count: number
}

/** Snow over the whole viewport for the season pages. Off for people who ask for reduced motion. */
export function SeasonSnow({ count }: SeasonSnowProps) {
  const reduced = useSyncExternalStore(subscribe, prefersReducedMotion, serverSnapshot)
  if (reduced) return null

  return (
    <Snowfall
      snowflakeCount={count}
      radius={[0.6, 2.6]}
      speed={[0.4, 1.6]}
      wind={[-0.4, 1]}
      // Pale blue reads on both the light and the dark theme; pure white vanishes on light.
      color="#cfe4f8"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 40,
        pointerEvents: "none"
      }}
    />
  )
}
