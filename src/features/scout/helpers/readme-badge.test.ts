import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import { readmeBadgeSnippet } from "@/features/scout/helpers/readme-badge"

describe("readmeBadgeSnippet", () => {
  it("mini rozeti Markdown olarak oyuncu sayfasına bağlar", () => {
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat")).toBe(
      "[![Gitscout](https://gitscout.io/badge/octocat.svg)](https://gitscout.io/u/octocat)"
    )
  })

  it("kartları iki kat PNG'yi küçülten HTML olarak verir", () => {
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat", "medium")).toBe(
      '<a href="https://gitscout.io/u/octocat"><img src="https://gitscout.io/badge/octocat.png?size=medium" alt="Gitscout" width="220"></a>'
    )
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat", "full")).toContain(
      'badge/octocat.png?size=full" alt="Gitscout" width="320"'
    )
  })

  it("İngilizce dışındaki dili adrese ekler, varsayılanı eklemez", () => {
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat", "mini", "tr")).toContain(
      "https://gitscout.io/badge/octocat.svg?lang=tr"
    )
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat", "full", "tr")).toContain(
      "https://gitscout.io/badge/octocat.png?size=full&lang=tr"
    )
    expect(readmeBadgeSnippet("https://gitscout.io", "octocat", "full", "en")).not.toContain(
      "lang="
    )
  })

  it.each(["mini", "medium", "full"] as const)(
    "llms.txt içindeki %s örneğiyle aynı biçimde",
    (size) => {
      const llms = readFileSync("public/llms.txt", "utf8")
      expect(llms).toContain(readmeBadgeSnippet("https://gitscout.io", "<username>", size))
    }
  )
})
