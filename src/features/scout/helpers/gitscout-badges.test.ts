import { describe, expect, it } from "vitest"

import { gitscoutBadges } from "@/features/scout/helpers/gitscout-badges"

describe("gitscoutBadges", () => {
  it("gives the first verified accounts their place", () => {
    expect(gitscoutBadges("u230709007")).toEqual([
      { id: "first-verified", values: { order: 10, total: 10 } }
    ])
  })

  it("gives milestone cards their number, ignoring case", () => {
    expect(gitscoutBadges("Yisoga")).toEqual([{ id: "milestone-card", values: { order: 1000 } }])
  })

  it("gives nothing to everyone else", () => {
    expect(gitscoutBadges("sindresorhus")).toEqual([])
  })
})
