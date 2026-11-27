import { describe, expect, it } from "vitest"

import { snapshotDecision } from "@/features/scout/helpers/snapshot-decision"

const DAY = 24 * 60 * 60_000
const now = new Date("2026-12-01T12:00:00Z")
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY)
const base = { now, scoreVersion: 6, intervalDays: 14, unsettled: 0 }

describe("snapshotDecision", () => {
  it("tablo boşsa ilk turu hemen alır", () => {
    expect(snapshotDecision({ ...base, last: null })).toBe("due")
  })

  it("süre dolmadıysa beklemez", () => {
    const last = { takenAt: daysAgo(13), scoreVersion: 6 }
    expect(snapshotDecision({ ...base, last })).toBe("not-due")
  })

  it("süre dolunca yeni tur alır", () => {
    const last = { takenAt: daysAgo(14), scoreVersion: 6 }
    expect(snapshotDecision({ ...base, last })).toBe("due")
  })

  it("formül sürümü değişince süreyi beklemez", () => {
    const last = { takenAt: daysAgo(1), scoreVersion: 5 }
    expect(snapshotDecision({ ...base, last })).toBe("due")
  })

  it("puanı yeniden hesaplanmayı bekleyen oyuncu varken yazmaz", () => {
    expect(snapshotDecision({ ...base, last: null, unsettled: 3 })).toBe("pending-rescore")
  })

  it("zamanı gelmediyse bekleyen oyuncu sonucu değiştirmez", () => {
    const last = { takenAt: daysAgo(2), scoreVersion: 6 }
    expect(snapshotDecision({ ...base, last, unsettled: 3 })).toBe("not-due")
  })
})
