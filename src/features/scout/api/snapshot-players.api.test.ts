import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  countUnsettledScores,
  getLatestSnapshot,
  insertSnapshot
} from "@/features/scout/api/player-store"
import { snapshotPlayers } from "@/features/scout/api/snapshot-players.api"
import { SCORE_VERSION } from "@/features/scout/constants/scoring.constants"

vi.mock("@/features/scout/api/player-store", () => ({
  countUnsettledScores: vi.fn(),
  getLatestSnapshot: vi.fn(),
  insertSnapshot: vi.fn()
}))

const now = Date.parse("2026-12-01T12:00:00Z")
const clock = () => now

describe("snapshotPlayers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(countUnsettledScores).mockResolvedValue(0)
  })

  it("tablo boşsa bütün oyuncuları o anla yazar", async () => {
    vi.mocked(getLatestSnapshot).mockResolvedValue(null)
    vi.mocked(insertSnapshot).mockResolvedValue(120)

    expect(await snapshotPlayers(clock)).toEqual({ status: "taken", players: 120 })
    expect(insertSnapshot).toHaveBeenCalledWith(new Date(now))
  })

  it("zamanı gelmediyse yazmaz", async () => {
    vi.mocked(getLatestSnapshot).mockResolvedValue({
      takenAt: new Date(now - 60_000),
      scoreVersion: SCORE_VERSION
    })

    expect(await snapshotPlayers(clock)).toEqual({ status: "not-due" })
    expect(insertSnapshot).not.toHaveBeenCalled()
  })

  it("yazma anında sürüm karışırsa turu bekleyen sayar", async () => {
    vi.mocked(getLatestSnapshot).mockResolvedValue(null)
    vi.mocked(insertSnapshot).mockResolvedValue(0)

    expect(await snapshotPlayers(clock)).toEqual({ status: "pending-rescore" })
  })

  it("veritabanı hatasında yenilemeyi bozmadan başarısız döner", async () => {
    vi.mocked(getLatestSnapshot).mockRejectedValue(new Error("timeout"))

    expect(await snapshotPlayers(clock)).toEqual({ status: "failed" })
    expect(console.error).toHaveBeenCalled()
  })
})
