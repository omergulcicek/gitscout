import { useEffect, useState } from "react"

import { useLocation, useNavigate } from "@tanstack/react-router"

/**
 * Whether this profile was opened right after its card was created, so the card should play its reveal.
 * The flag lives in the history entry; it's read once on mount and then removed, so a refresh or a later
 * visit shows the card normally.
 */
export function useCardReveal(): boolean {
  const fromCreation = useLocation({ select: (location) => location.state.cardReveal === true })
  const [playing] = useState(fromCreation)
  const navigate = useNavigate()

  useEffect(() => {
    if (!fromCreation) return
    void navigate({
      to: ".",
      replace: true,
      resetScroll: false,
      state: (previous) => ({ ...previous, cardReveal: undefined })
    })
  }, [fromCreation, navigate])

  return playing
}
