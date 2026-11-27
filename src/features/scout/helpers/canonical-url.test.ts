import { describe, expect, it } from "vitest"

import { canonicalUrl } from "@/features/scout/helpers/canonical-url"

const url = (path: string) => new URL(path, "https://gitscout.io")

describe("canonicalUrl", () => {
  it("returns null when the URL is already canonical", () => {
    expect(canonicalUrl(url("/og/ada?v=1"), { v: "1" })).toBeNull()
    expect(canonicalUrl(url("/badge/ada.svg"), { lang: undefined })).toBeNull()
  })

  it("drops unknown parameters", () => {
    expect(canonicalUrl(url("/og/ada?v=1&x=123"), { v: "1" })).toBe("/og/ada?v=1")
    expect(canonicalUrl(url("/badge/ada.svg?cache=bust"), { lang: undefined })).toBe(
      "/badge/ada.svg"
    )
  })

  it("replaces a stale or missing version", () => {
    expect(canonicalUrl(url("/og/ada?v=999"), { v: "1" })).toBe("/og/ada?v=1")
    expect(canonicalUrl(url("/og/ada"), { v: "1" })).toBe("/og/ada?v=1")
  })

  it("rewrites the path when given", () => {
    expect(canonicalUrl(url("/og/ADA?v=1"), { v: "1" }, "/og/ada")).toBe("/og/ada?v=1")
    expect(canonicalUrl(url("/og/ada?v=1"), { v: "1" }, "/og/ada")).toBeNull()
  })

  it("puts parameters in a fixed order", () => {
    expect(
      canonicalUrl(url("/badge/ada.png?lang=tr&size=full"), { size: "full", lang: "tr" })
    ).toBe("/badge/ada.png?size=full&lang=tr")
  })
})
