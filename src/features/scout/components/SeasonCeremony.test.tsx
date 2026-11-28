import { createRef } from "react"

import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SeasonCeremony } from "@/features/scout/components/SeasonCeremony"
import type { CeremonyFact } from "@/features/scout/components/SeasonCeremony"
import type { ListPlayer } from "@/features/scout/types/player.types"

const stat = (key: string, value: number) => ({ key, value })

const PLAYER = {
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

const FACTS: CeremonyFact[] = [{ label: "Commits", value: 342, format: (value) => String(value) }]

function mockMatchMedia(reduced: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
}

function renderCeremony(onClose = vi.fn()) {
  const target = createRef<HTMLDivElement>()
  render(
    <>
      <div ref={target} />
      <SeasonCeremony
        player={PLAYER}
        year={2026}
        voice="other"
        facts={FACTS}
        target={target}
        onClose={onClose}
      />
    </>
  )
  return { onClose }
}

describe("SeasonCeremony", () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("moves initial focus onto the open button and traps Tab inside the dialog", async () => {
    const user = userEvent.setup()
    renderCeremony()

    const skip = screen.getByRole("button", { name: /skip/i })
    const open = screen.getByRole("button", { name: /^open the pack$/i })

    expect(open).toHaveFocus()

    await user.tab()
    expect(skip).toHaveFocus()

    await user.tab({ shift: true })
    expect(open).toHaveFocus()
  }, 15_000)

  it("dismisses with Escape on open and keeps Escape working after opening the pack", async () => {
    const user = userEvent.setup()
    const { onClose } = renderCeremony()

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledWith("skipped")

    onClose.mockClear()
    await user.click(screen.getByRole("button", { name: /^open the pack$/i }))

    const skip = screen.getByRole("button", { name: /skip/i })
    expect(skip).toHaveFocus()

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledWith("skipped")
  })

  it("respects prefers-reduced-motion during shatter and CountUp", () => {
    vi.useFakeTimers()
    mockMatchMedia(true)
    const animateSpy = vi.fn()
    Element.prototype.animate = animateSpy

    renderCeremony()
    fireEvent.click(screen.getByRole("button", { name: /^open the pack$/i }))

    // CHARGE_MS (2000) -> shatter -> SHATTER_MS (1000) -> facts -> 0ms reduced-motion timer.
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(animateSpy).not.toHaveBeenCalled()
    expect(screen.getByText("342")).toBeInTheDocument()
  })
})
