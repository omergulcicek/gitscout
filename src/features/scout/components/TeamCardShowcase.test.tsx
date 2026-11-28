import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider
} from "@tanstack/react-router"
import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { TeamCardShowcase } from "@/features/scout/components/TeamCardShowcase"
import type { ListPlayer } from "@/features/scout/types/player.types"
import { renderWithProviders } from "@/test/render"

vi.mock("@/hooks/use-viewer", () => ({
  useViewer: () => ({ data: null })
}))

const stat = (key: string, value: number) => ({ key, value })

const SAMPLE = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  club: null,
  position: "Backend",
  ovr: 82,
  ovrExact: 82,
  rarity: "gold",
  title: { stat: "act", rarity: "gold", variant: 0 },
  stats: {
    act: stat("act", 80),
    imp: stat("imp", 81),
    com: stat("com", 82),
    rep: stat("rep", 83),
    con: stat("con", 84),
    exp: stat("exp", 85)
  },
  year: { commits: 200, prs: 20, reviews: 10, issues: 5, activeDays: 100, longestStreak: 14 },
  career: { followers: 100, stars: 500, contributions: 1000 },
  badges: [],
  fetchedAt: "2026-11-28T00:00:00Z"
} as unknown as ListPlayer

function renderShowcase() {
  const rootRoute = createRootRoute({
    component: () => (
      <TeamCardShowcase sample={SAMPLE} settingsLink={<a href="/settings">Settings</a>} />
    )
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] })
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe("TeamCardShowcase", () => {
  it("announces that external links open in a new tab", async () => {
    renderShowcase()

    const sourceLink = await screen.findByRole("link", {
      name: /football-logos\.cc\s*\(opens in a new tab\)/i
    })
    const requestLink = screen.getByRole("link", {
      name: /request it on github\s*\(opens in a new tab\)/i
    })

    expect(sourceLink).toHaveAttribute("target", "_blank")
    expect(sourceLink).toHaveAttribute("rel", "noreferrer")
    expect(requestLink).toHaveAttribute("target", "_blank")
    expect(requestLink).toHaveAttribute("rel", "noreferrer")
  }, 15_000)
})
