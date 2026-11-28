import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type SeasonOpenedState = {
  /** Season packs opened in this browser, by `login:year`. */
  opened: Record<string, true>
  markOpened: (key: string) => void
}

/** The key a season pack is remembered under. */
export const seasonPackKey = (login: string, year: number) => `${login.toLowerCase()}:${year}`

// Browser-only memory, so a module-level store is fine. Rehydrated after mount: the server always renders
// the sealed pack, and a pack already opened here is skipped once the saved list is read.
export const useSeasonOpenedStore = create<SeasonOpenedState>()(
  persist(
    (set) => ({
      opened: {},
      markOpened: (key) => set((state) => ({ opened: { ...state.opened, [key]: true } }))
    }),
    {
      name: "gitscout-season-opened",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true
    }
  )
)
