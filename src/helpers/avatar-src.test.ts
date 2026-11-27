import { describe, expect, it } from "vitest"

import { avatarSrc } from "@/helpers/avatar-src"

describe("avatarSrc", () => {
  it("asks GitHub for twice the CSS size", () => {
    expect(avatarSrc("https://avatars.githubusercontent.com/u/1?v=4", 36)).toBe(
      "https://avatars.githubusercontent.com/u/1?v=4&s=72"
    )
  })

  it("replaces an existing size", () => {
    expect(avatarSrc("https://avatars.githubusercontent.com/u/1?s=460&v=4", 24)).toBe(
      "https://avatars.githubusercontent.com/u/1?s=48&v=4"
    )
  })

  it("leaves other URLs alone", () => {
    expect(avatarSrc("https://example.com/a.png", 24)).toBe("https://example.com/a.png")
    expect(avatarSrc("", 24)).toBe("")
  })
})
