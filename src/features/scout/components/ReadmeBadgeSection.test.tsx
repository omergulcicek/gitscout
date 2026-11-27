import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { siteConfig } from "@/config/site.config"

import { ReadmeBadgeSection } from "@/features/scout/components/ReadmeBadgeSection"
import type { ListPlayer } from "@/features/scout/types/player.types"

const stat = (key: string, value: number) => ({ key, value })

const player = {
  login: "octocat",
  name: "The Octocat",
  avatarUrl: "",
  club: null,
  position: "Backend",
  ovr: 82,
  rarity: "gold",
  title: { stat: "act", rarity: "gold", variant: 0 },
  stats: {
    act: stat("act", 80),
    imp: stat("imp", 81),
    com: stat("com", 82),
    rep: stat("rep", 83),
    con: stat("con", 84),
    exp: stat("exp", 85)
  },
  badges: []
} as unknown as ListPlayer

function renderSection() {
  const user = userEvent.setup()
  render(<ReadmeBadgeSection player={player} />)
  return user
}

describe("ReadmeBadgeSection", () => {
  it("varsayılan olarak orta boy kartı seçer", () => {
    renderSection()

    expect(screen.getByRole("tab", { name: /medium/i })).toHaveAttribute("aria-selected", "true")
  })

  it("mini rozetin önizlemesini ağ isteği olmadan kartın puanından üretir", async () => {
    const user = renderSection()
    await user.click(screen.getByRole("tab", { name: /mini/i }))

    const src = screen.getByAltText(/octocat/i).getAttribute("src") ?? ""
    expect(src).toMatch(/^data:image\/svg\+xml/)
    expect(decodeURIComponent(src)).toContain("82 rating · gold")
  })

  it("AI ajanı için komutu kopyalar", async () => {
    const user = renderSection()

    await user.click(screen.getByRole("button", { name: /copy ai prompt/i }))

    const text = await navigator.clipboard.readText()
    expect(text).toContain(`${siteConfig.url}/llms.txt`)
    expect(text).toContain("octocat")
  })

  it("mini rozette README için Markdown'ı kullanıcı adıyla gösterir ve kopyalar", async () => {
    const user = renderSection()
    await user.click(screen.getByRole("tab", { name: /mini/i }))
    const markdown = `[![Gitscout](${siteConfig.url}/badge/octocat.svg)](${siteConfig.url}/u/octocat)`

    // Satır renklendirme için parçalara bölünür; okunan metin yine tek parça Markdown'dır.
    expect(screen.getByLabelText("Markdown")).toHaveTextContent(markdown, {
      normalizeWhitespace: false
    })

    // Satırın yanındaki simge düğmesi ve alttaki düğme aynı metni kopyalar.
    const buttons = screen.getAllByRole("button", { name: /copy markdown/i })
    expect(buttons).toHaveLength(2)
    for (const button of buttons) {
      await navigator.clipboard.writeText("")
      await user.click(button)
      expect(await navigator.clipboard.readText()).toBe(markdown)
    }
  })

  it("kart boyunda HTML kodunu kopyalar", async () => {
    const user = renderSection()

    const html = `<a href="${siteConfig.url}/u/octocat"><img src="${siteConfig.url}/badge/octocat.png?size=medium" alt="Gitscout" width="220"></a>`
    expect(screen.getByLabelText("HTML")).toHaveTextContent(html, { normalizeWhitespace: false })

    for (const button of screen.getAllByRole("button", { name: /copy html/i })) {
      await navigator.clipboard.writeText("")
      await user.click(button)
      expect(await navigator.clipboard.readText()).toBe(html)
    }
  })
})
