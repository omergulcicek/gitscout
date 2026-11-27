import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type SnowState = {
  /** Snow falls unless the person turned it off; the choice is kept in this browser. */
  enabled: boolean
  toggle: () => void
}

// Browser-only preference, so a module-level store is fine. Rehydrated after mount: the server always
// renders the default, and the saved choice takes over in the browser.
export const useSnowStore = create<SnowState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((state) => ({ enabled: !state.enabled }))
    }),
    {
      name: "gitscout-snow",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    }
  )
)
