import { useEffect, useRef } from "react"

/** Same gate as the hover lift: a real pointer that hovers, and motion allowed. */
const TILT_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"

/** Largest turn on each axis; past ~12° the 320px card's text starts to smear. */
const MAX_TILT_X = 8
const MAX_TILT_Y = 10

const PROPERTIES = ["--card-mx", "--card-my", "--rx", "--ry"] as const

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Tilts a showcase card toward the pointer and moves its light with it. The position goes to CSS
 * variables on the wrapper (`--card-mx`/`--card-my` for the light, `--rx`/`--ry` for the turn) once per frame,
 * without React state, so a moving pointer never re-renders the card. When the pointer leaves, the
 * variables are cleared and the card settles back to its resting pose, the same one downloads show.
 */
export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node || !window.matchMedia(TILT_QUERY).matches) return

    let frame = 0
    let point: { x: number; y: number } | null = null

    const apply = () => {
      frame = 0
      if (!point) return
      // Measured on every frame: phones zoom the card and the page may have scrolled.
      const rect = node.getBoundingClientRect()
      const x = clamp((point.x - rect.left) / rect.width)
      const y = clamp((point.y - rect.top) / rect.height)
      node.style.setProperty("--card-mx", `${(x * 100).toFixed(1)}%`)
      node.style.setProperty("--card-my", `${(y * 100).toFixed(1)}%`)
      node.style.setProperty("--rx", `${((0.5 - y) * 2 * MAX_TILT_X).toFixed(2)}deg`)
      node.style.setProperty("--ry", `${((x - 0.5) * 2 * MAX_TILT_Y).toFixed(2)}deg`)
    }

    const move = (event: PointerEvent) => {
      point = { x: event.clientX, y: event.clientY }
      node.dataset.tilting = ""
      frame ||= requestAnimationFrame(apply)
    }

    const leave = () => {
      point = null
      cancelAnimationFrame(frame)
      frame = 0
      delete node.dataset.tilting
      for (const property of PROPERTIES) node.style.removeProperty(property)
    }

    node.addEventListener("pointermove", move, { passive: true })
    node.addEventListener("pointerleave", leave)
    return () => {
      node.removeEventListener("pointermove", move)
      node.removeEventListener("pointerleave", leave)
      leave()
    }
  }, [])

  return ref
}
