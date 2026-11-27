import { describe, expect, it } from "vitest"

import { shareText } from "@/features/scout/helpers/share-text"
import type { PlayerDetail } from "@/features/scout/types/player.types"

const player = {
  login: "octocat",
  ovr: 87,
  rarity: "gold",
  position: "Full Stack",
  title: { stat: "imp", rarity: "gold", variant: 0 },
  ranking: { overall: 1234, total: 56789, inPosition: 1, positionTotal: 1 },
  archetype: { rarity: "gold", strengths: ["com"], growth: [] },
  badges: [{ id: "night-owl", values: {} }],
  stats: {
    com: { key: "com", value: 90, raw: 90, summary: { key: "com", followers: 4321 }, parts: [] }
  }
} as unknown as PlayerDetail

/** X her linki 23 karakter sayar. */
const xLength = (text: string) => text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length

describe("shareText", () => {
  it.each(["tr", "en"] as const)("X metni 280 karaktere sığar (%s)", (locale) => {
    const text = shareText(player, "x", locale)
    expect(xLength(text)).toBeLessThanOrEqual(280)
    expect(text).toContain("87")
  })

  it("seçilen dilde yazar ve o dilin linkini koyar", () => {
    expect(shareText(player, "linkedin", "tr")).toContain("/tr/u/octocat")
    expect(shareText(player, "linkedin", "tr")).toContain("Rol: Full Stack")
    expect(shareText(player, "linkedin", "en")).toContain("Role: Full Stack")
  })

  it("LinkedIn metnine scout notunun ilk maddesini seçilen dilde koyar", () => {
    expect(shareText(player, "linkedin", "tr")).toContain(`Scout notu: "4.321 takipçi`)
    expect(shareText(player, "linkedin", "en")).toContain(`Scout note: "4,321 followers`)
  })

  it("güçlü yanı olmayan kartta not satırını ve fazladan boşluğu atlar", () => {
    const plain = { ...player, archetype: { rarity: "bronze", strengths: [], growth: ["act"] } }
    const text = shareText(plain as PlayerDetail, "linkedin", "tr")
    expect(text).not.toContain("Scout notu")
    expect(text).toContain("🏅")
    expect(text).not.toContain("\n\n\n")
  })
})
