import { useEffect, useSyncExternalStore } from "react"

import { Snowflake } from "lucide-react"
import Snowfall from "react-snowfall"

import { Button } from "@/components/ui/button"
import { useSnowStore } from "@/features/scout/stores/snow.store"
import * as m from "@/paraglide/messages.js"

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

/**
 * Snow over the whole viewport for the season pages, on by default, with a corner button to stop it.
 * Off entirely for people who ask for reduced motion.
 */
export function SeasonSnow({ count }: SeasonSnowProps) {
  const reduced = useSyncExternalStore(subscribe, prefersReducedMotion, serverSnapshot)
  const enabled = useSnowStore((state) => state.enabled)
  const toggle = useSnowStore((state) => state.toggle)

  useEffect(() => {
    void useSnowStore.persist.rehydrate()
  }, [])

  if (reduced) return null

  return (
    <>
      {enabled ? (
        <Snowfall
          snowflakeCount={count}
          radius={[0.6, 2.6]}
          speed={[0.8, 2.4]}
          wind={[0.6, 3]}
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
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        aria-pressed={!enabled}
        className="fixed right-4 bottom-4 z-50 bg-background/80 backdrop-blur"
      >
        <Snowflake aria-hidden />
        {/* Icon only on phones, where the button would cover the page's text. */}
        <span className="max-sm:sr-only">{enabled ? m.snow_stop() : m.snow_start()}</span>
      </Button>
    </>
  )
}
