import { describe, expect, it } from "vitest"

import { errorText } from "@/features/scout/helpers/error-text"
import * as m from "@/paraglide/messages.js"

describe("errorText", () => {
  it("IP sınırı koduna kendi mesajını verir", () => {
    expect(errorText(new Error("limit:too-many-requests"))).toBe(m.error_too_many_requests())
  })

  it("saatlik ve günlük IP sınırına ayrı mesaj verir", () => {
    expect(errorText(new Error("limit:ip-lookups"))).toBe(m.error_ip_lookups())
  })

  it("GitHub kodlarını eşler", () => {
    expect(errorText(new Error("github:not-found"))).toBe(m.error_github_not_found())
  })

  it("bilinmeyen hatada genel mesaja düşer", () => {
    expect(errorText(new Error("Too Many Requests"))).toBe(m.error_generic())
    expect(errorText("string error")).toBe(m.error_generic())
  })
})
