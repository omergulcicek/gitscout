import { describe, expect, it } from "vitest"

import { OG_DESIGN_VERSION, ogVersion } from "@/features/scout/helpers/og-version"

describe("ogVersion", () => {
  it("leads with the design version", () => {
    expect(ogVersion(1700000000000)).toBe(`${OG_DESIGN_VERSION}.1700000000000`)
  })

  it("follows the newest stamp", () => {
    expect(ogVersion(10, 30, 20)).toBe(`${OG_DESIGN_VERSION}.30`)
  })
})
