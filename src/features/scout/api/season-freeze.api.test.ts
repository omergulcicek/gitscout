import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchSeasonCalendar, GithubError } from "@/features/scout/api/get-github-data.api"
import {
  getFreezeInputs,
  getUnfrozenLogins,
  insertFrozenSeason
} from "@/features/scout/api/player-store"
import { freezeClosedSeasons, freezeSeason } from "@/features/scout/api/season-freeze.api"
import type { ScoredPlayer } from "@/features/scout/types/player.types"

vi.mock("@/features/scout/api/get-github-data.api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  fetchSeasonCalendar: vi.fn()
}))
vi.mock("@/features/scout/api/player-store", () => ({
  getFreezeInputs: vi.fn(),
  getUnfrozenLogins: vi.fn(),
  insertFrozenSeason: vi.fn()
}))

const CLOSED = new Date("2027-01-05T00:00:00Z")

function fullYear(year: number) {
  const start = Date.UTC(year, 0, 1)
  const length = (Date.UTC(year + 1, 0, 1) - start) / 86_400_000
  return Array.from({ length }, (_, index) => ({
    date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
    count: 1
  }))
}

const scored = {
  login: "me",
  ovr: 78,
  rarity: "gold",
  position: "Frontend",
  title: { stat: "act", rarity: "gold", variant: 0 },
  claimedCountry: "TR"
} as unknown as ScoredPlayer

describe("freezeSeason", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getFreezeInputs).mockResolvedValue({
      login: "me",
      yearly: [{ year: 2025, total: 851 }],
      scored
    })
  })

  it("does nothing while the season is open", async () => {
    const row = await freezeSeason("me", 2026, { now: new Date("2027-01-01T12:00:00Z"), db: "app" })
    expect(row).toBeNull()
    expect(fetchSeasonCalendar).not.toHaveBeenCalled()
  })

  it("builds the row from GitHub's calendar for the year", async () => {
    vi.mocked(fetchSeasonCalendar).mockResolvedValue({
      githubId: 42,
      days: fullYear(2026),
      total: 365,
      reviews: 2
    })
    const row = await freezeSeason("me", 2026, { now: CLOSED, db: "app" })
    expect(row).toMatchObject({
      format: 1,
      githubId: 42,
      year: 2026,
      total: 365,
      reviews: 2,
      card: { ovr: 78, rarity: "gold", position: "Frontend", country: "TR" }
    })
    expect(row?.counts).toHaveLength(365)
  })

  it("never writes from a dev server", async () => {
    vi.mocked(fetchSeasonCalendar).mockResolvedValue({
      githubId: 42,
      days: fullYear(2026),
      total: 365,
      reviews: 0
    })
    await freezeSeason("me", 2026, { now: CLOSED, db: "app" })
    // Vitest runs with DEV set, the same as `pnpm dev`.
    expect(insertFrozenSeason).not.toHaveBeenCalled()
  })

  it("refuses a calendar with missing days", async () => {
    vi.mocked(fetchSeasonCalendar).mockResolvedValue({
      githubId: 42,
      days: fullYear(2026).slice(1),
      total: 364,
      reviews: 0
    })
    expect(await freezeSeason("me", 2026, { now: CLOSED, db: "app" })).toBeNull()
  })
})

describe("freezeClosedSeasons", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(getFreezeInputs).mockImplementation(async (login) => ({ login, yearly: [], scored }))
  })

  it("skips the database entirely while the season is open", async () => {
    const result = await freezeClosedSeasons(2026, () => Date.parse("2026-12-31T00:00:00Z"))
    expect(result.frozen).toEqual([])
    expect(getUnfrozenLogins).not.toHaveBeenCalled()
  })

  it("stops at a rate limit and leaves the rest for the next run", async () => {
    vi.mocked(getUnfrozenLogins).mockResolvedValue(["a", "b", "c"])
    vi.mocked(fetchSeasonCalendar)
      .mockResolvedValueOnce({ githubId: 1, days: fullYear(2026), total: 365, reviews: 0 })
      .mockRejectedValueOnce(new GithubError("limit", "rate-limit"))
    const result = await freezeClosedSeasons(2026, () => CLOSED.getTime())
    expect(result).toEqual({ frozen: ["a"], failed: ["b"], skipped: 1 })
  })
})
