import { describe, expect, it } from "vitest"

import { loginReturnPath } from "@/helpers/login-return"

describe("loginReturnPath", () => {
  it("resolves a known page", () => {
    expect(loginReturnPath("season")).toBe("/season")
  })

  it("ignores anything outside the fixed list", () => {
    expect(loginReturnPath(undefined)).toBeUndefined()
    expect(loginReturnPath("/season")).toBeUndefined()
    expect(loginReturnPath("https://example.com")).toBeUndefined()
    expect(loginReturnPath("//example.com")).toBeUndefined()
    expect(loginReturnPath("toString")).toBeUndefined()
  })
})
