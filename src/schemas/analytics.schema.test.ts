import { describe, expect, it } from "vitest"

import { analyticsEventSchema } from "@/schemas/analytics.schema"

describe("analyticsEventSchema", () => {
  it("accepts the events the site sends", () => {
    expect(
      analyticsEventSchema.safeParse({ name: "card_shared", login: "shadcn", target: "x" }).success
    ).toBe(true)
    expect(
      analyticsEventSchema.safeParse({ name: "card_request_failed", reason: "github:not-found" })
        .success
    ).toBe(true)
  })

  it("rejects free text in logins, reasons and share targets", () => {
    expect(
      analyticsEventSchema.safeParse({ name: "card_downloaded", login: "not a login!" }).success
    ).toBe(false)
    expect(
      analyticsEventSchema.safeParse({ name: "card_request_failed", reason: "anything goes" })
        .success
    ).toBe(false)
    expect(
      analyticsEventSchema.safeParse({ name: "card_shared", login: "shadcn", target: "spam" })
        .success
    ).toBe(false)
  })
})
