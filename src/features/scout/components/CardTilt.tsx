import type { ReactNode } from "react"

import { useCardTilt } from "@/features/scout/hooks/use-card-tilt"

type CardTiltProps = {
  children: ReactNode
}

/**
 * Wraps a showcase card (home, profile, duel) so it turns toward the pointer and its light follows.
 * The turn sits on this wrapper, never on the card itself: the card is the node that downloads capture,
 * and it clips its corners, which would flatten a 3D turn. Each mount also runs one light sweep, so
 * phones, which have no hover, still see the finish once.
 */
export function CardTilt({ children }: CardTiltProps) {
  const ref = useCardTilt<HTMLDivElement>()
  return (
    <div ref={ref} className="card-tilt card-glare-sweep">
      <div className="card-tilt-inner">{children}</div>
    </div>
  )
}
