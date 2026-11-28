import { describe, expect, it } from "vitest"

import { drawableName, drawableText, fitCardName } from "@/features/scout/helpers/card-name"

describe("fitCardName", () => {
  it("keeps a name that fits", () => {
    expect(fitCardName("Ömer Gülçiçek", "medium")).toBe("Ömer Gülçiçek")
  })

  it("turns middle names into initials before anything else", () => {
    expect(fitCardName("Kamila de fatima santos oliveira", "medium")).toBe("Kamila oliveira")
    expect(fitCardName("David Heinemeier Hansson", "medium")).toBe("David H. Hansson")
  })

  it("keeps the surname when two long names share a first name", () => {
    expect(fitCardName("Maximilian Alexander von Hohenzollern", "full")).toBe("Maximilian Hohenzo…")
    expect(fitCardName("David Heinemeier Hansson", "full")).toBe("David H. Hansson")
  })

  it("cuts names with separators instead of shortening their parts", () => {
    expect(fitCardName("Adrian Hajdin - JS Mastery", "medium")).toBe("Adrian Hajdin - J…")
    expect(fitCardName("Serdar Dogruyol - Sedo", "medium")).toBe("Serdar Dogruyol…")
  })

  it("cuts a single long word", () => {
    expect(fitCardName("Mollahüseyinoğlugillerden", "mini")).toBe("Mollahüseyi…")
  })
})

describe("drawableName", () => {
  it("drops characters the font cannot draw and the separator they leave", () => {
    expect(drawableName("Serdar Dogruyol - Sedo セド", "sdogruyol")).toBe("Serdar Dogruyol - Sedo")
  })

  it("keeps Turkish and other Latin letters", () => {
    expect(drawableName("Şükrü Çağlar Ölmez", "x")).toBe("Şükrü Çağlar Ölmez")
  })

  it("falls back to the username when no letters are left", () => {
    expect(drawableName("李小龙 🚀", "bruce")).toBe("@bruce")
  })
})

describe("drawableText", () => {
  it("removes emoji from a club name", () => {
    expect(drawableText("Acme 🚀 Labs")).toBe("Acme Labs")
  })
})
