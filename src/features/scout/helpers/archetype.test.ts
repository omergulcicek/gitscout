import { describe, expect, it } from "vitest"

import { computeArchetype } from "@/features/scout/helpers/archetype"
import type { Stat, StatKey } from "@/features/scout/types/player.types"

const stat = (key: StatKey, value: number): Stat => ({
  key,
  value,
  raw: value,
  summary: { key: "com", followers: 0 },
  parts: []
})

const stats = (values: Record<StatKey, number>) => ({
  act: stat("act", values.act),
  imp: stat("imp", values.imp),
  com: stat("com", values.com),
  rep: stat("rep", values.rep),
  con: stat("con", values.con),
  exp: stat("exp", values.exp)
})

describe("computeArchetype", () => {
  it("zayıf yan varsa iki güçlü yan ve bir tavsiye verir", () => {
    const archetype = computeArchetype(
      stats({ act: 90, imp: 78, com: 77, rep: 62, con: 87, exp: 85 }),
      "gold"
    )
    expect(archetype).toEqual({ rarity: "gold", strengths: ["act", "con"], growth: ["rep"] })
  })

  it("zayıf yan yoksa üç güçlü yan verir", () => {
    const archetype = computeArchetype(
      stats({ act: 93, imp: 94, com: 92, rep: 88, con: 95, exp: 96 }),
      "icon"
    )
    expect(archetype.strengths).toEqual(["con", "imp", "act"])
    expect(archetype.growth).toEqual([])
  })

  it("güçlü yanı az olanda boşluğu en zayıftan başlayan tavsiyelerle doldurur", () => {
    const archetype = computeArchetype(
      stats({ act: 72, imp: 40, com: 30, rep: 20, con: 65, exp: 50 }),
      "bronze"
    )
    expect(archetype.strengths).toEqual(["act"])
    expect(archetype.growth).toEqual(["rep", "com"])
  })

  it("hiç güçlü yanı yoksa üç tavsiye verir", () => {
    const archetype = computeArchetype(
      stats({ act: 10, imp: 20, com: 30, rep: 40, con: 50, exp: 60 }),
      "bronze"
    )
    expect(archetype.strengths).toEqual([])
    expect(archetype.growth).toEqual(["act", "imp", "com"])
  })

  it("kıdemi ancak başka seçenek kalmazsa yazar", () => {
    const archetype = computeArchetype(
      stats({ act: 10, imp: 20, com: 30, rep: 40, con: 50, exp: 5 }),
      "bronze"
    )
    expect(archetype.growth).toEqual(["act", "imp", "com"])
  })
})
