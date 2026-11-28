import { useState } from "react"

import { Bot, Check, Code, Copy, FileText } from "lucide-react"
import { toast } from "sonner"

import { siteConfig } from "@/config/site.config"

import { trackEvent } from "@/lib/analytics"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeCardPreview } from "@/features/scout/components/BadgeCardPreview"
import { BADGE_CARD_SIZES, BADGE_SIZES } from "@/features/scout/constants/badge.constants"
import { playerBadgeSvg, svgDataUri } from "@/features/scout/helpers/player-badge"
import { readmeBadgeParts, readmeBadgeSnippet } from "@/features/scout/helpers/readme-badge"
import { badgeLocaleSchema, badgeSizeSchema } from "@/features/scout/schemas/badge.schema"
import type { BadgeLocale, BadgeSize } from "@/features/scout/schemas/badge.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { locales } from "@/paraglide/runtime.js"

type ReadmeBadgeSectionProps = { player: ListPlayer }

const SIZE_LABELS = {
  mini: m.readme_size_mini,
  medium: m.readme_size_medium,
  full: m.readme_size_full
} as const satisfies Record<BadgeSize, () => string>

/** Tam kart önizlemesinin genişliği: README'deki 316 px, iki sütunlu düzende önizleme sütununa sığmaz. */
const FULL_PREVIEW_WIDTH = 240

/** Kopyalandı işaretinin ekranda kalma süresi. */
const COPIED_MS = 2000

/**
 * Profil README'sine rozet eklemek için iki yol: AI ajanına verilecek komut ya da hazır Markdown.
 * Üç boy var: mini şerit, orta ve tam kart. Hepsinin önizlemesi sunucuyu beklemeden yerelde çizilir.
 */
export function ReadmeBadgeSection({ player }: ReadmeBadgeSectionProps) {
  return (
    <section aria-labelledby="readme-heading" className="surface flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h2 id="readme-heading" className="text-sm font-semibold">
          {m.readme_badge()}
        </h2>
        <p className="text-xs text-balance text-muted-foreground">{m.readme_badge_hint()}</p>
      </div>
      <ReadmeBadgeContent player={player} />
    </section>
  )
}

/** Başlıksız gövde: oyuncu sayfasındaki Paylaş menüsünün penceresi kendi başlığını kullanır. */
export function ReadmeBadgeContent({ player }: ReadmeBadgeSectionProps) {
  const { login } = player
  const [size, setSize] = useState<BadgeSize>("medium")
  // Rozet dili sayfa dilinden bağımsız: README'yi okuyanlar için İngilizce varsayılan.
  const [locale, setLocale] = useState<BadgeLocale>("en")
  const snippet = readmeBadgeSnippet(siteConfig.url, login, size, locale)
  const parts = readmeBadgeParts(siteConfig.url, login, size, locale)
  const isCard = parts.width !== null
  const previewWidth = size === "full" ? FULL_PREVIEW_WIDTH : BADGE_CARD_SIZES.medium.width
  const [copied, setCopied] = useState(false)

  const copy = (via: "prompt" | "markdown") => {
    trackEvent({ name: "readme_badge_copied", login, via, size, locale })
    const url = `${siteConfig.url}/llms.txt`
    const prompt =
      size === "mini"
        ? m.readme_prompt({ url, username: login })
        : m.readme_prompt_card({ url, username: login, size })
    const text =
      via === "prompt"
        ? locale === "en"
          ? prompt
          : `${prompt} ${m.readme_prompt_lang({ lang: locale })}`
        : snippet
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (via === "markdown") {
          setCopied(true)
          setTimeout(() => setCopied(false), COPIED_MS)
        }
        toast.success(
          via === "prompt"
            ? m.readme_prompt_copied()
            : isCard
              ? m.readme_html_copied()
              : m.readme_markdown_copied()
        )
      })
      .catch(() => toast.error(m.readme_copy_failed()))
  }

  const copyLabel = isCard ? m.readme_copy_html() : m.readme_copy_markdown()

  return (
    // Genişlik ekranı değil kapsayıcıyı izler: aynı gövde hem dar ayarlar sütununda hem pencerede.
    <div className="@container flex flex-col gap-4">
      {/* Dar alanda dil seçimi alt satıra iner: üç boy sekmesi tek başına satırı doldurur. */}
      <div className="flex flex-col gap-2 @sm:flex-row">
        <Tabs
          value={size}
          onValueChange={(value) => {
            const parsed = badgeSizeSchema.safeParse(value)
            if (parsed.success) setSize(parsed.data)
          }}
          className="min-w-0 flex-1"
        >
          <TabsList aria-label={m.readme_size_label()} className="w-full">
            {BADGE_SIZES.map((item) => (
              <TabsTrigger key={item} value={item}>
                {SIZE_LABELS[item]()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs
          value={locale}
          onValueChange={(value) => {
            const parsed = badgeLocaleSchema.safeParse(value)
            if (parsed.success) setLocale(parsed.data)
          }}
        >
          <TabsList aria-label={m.readme_lang_label()}>
            {locales.map((item) => (
              <TabsTrigger key={item} value={item} lang={item} className="px-2.5 font-mono text-xs">
                {item.toLocaleUpperCase("en")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Geniş alanda önizleme solda, kod sağda: tam kart pencereyi aşağı uzatıp kaydırma istemesin. */}
      <div className="flex flex-col gap-4 @xl:grid @xl:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Rozetin README'de nasıl duracağını gösteren küçük bir dosya görünümü. */}
        <figure className="overflow-hidden rounded-lg border bg-background">
          <figcaption className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            <FileText aria-hidden className="size-3.5" />
            README.md
          </figcaption>
          <div className="flex items-center justify-center bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[14px_14px] px-4 py-8 @xl:min-h-[27rem]">
            {size === "mini" ? (
              <img
                src={svgDataUri(playerBadgeSvg({ ovr: player.ovr, rarity: player.rarity, locale }))}
                alt={m.readme_badge_preview({ username: login })}
                height={28}
                className="my-2 h-7 w-fit drop-shadow-sm"
              />
            ) : (
              // Kartlar sunucuya gitmeden elimizdeki veriyle anında çizilir; PNG ile aynı bileşenler.
              <BadgeCardPreview player={player} size={size} locale={locale} width={previewWidth} />
            )}
          </div>
        </figure>

        <div className="flex min-w-0 flex-col gap-4 @xl:h-full">
          <div className="flex flex-col gap-1.5">
            <span id="readme-markdown-label" className="text-xs font-medium text-muted-foreground">
              {isCard ? m.readme_html_label() : m.readme_markdown_label()}
            </span>
            <div className="flex items-start gap-2 rounded-md border bg-background py-1.5 ps-3 pe-1.5">
              <code
                aria-labelledby="readme-markdown-label"
                className="min-w-0 flex-1 py-1 font-mono text-xs leading-relaxed break-all text-muted-foreground"
              >
                {isCard ? (
                  <>
                    {'<a href="'}
                    <span className="text-code-link">{parts.link}</span>
                    {'"><img src="'}
                    <span className="text-code-image">{parts.image}</span>
                    {'" alt="'}
                    <span className="text-code-alt">{parts.alt}</span>
                    {`" width="${parts.width}"></a>`}
                  </>
                ) : (
                  <>
                    [![<span className="text-code-alt">{parts.alt}</span>](
                    <span className="text-code-image">{parts.image}</span>)](
                    <span className="text-code-link">{parts.link}</span>)
                  </>
                )}
              </code>
              <Button
                size="icon"
                variant="ghost"
                aria-label={copyLabel}
                onClick={() => copy("markdown")}
                className="size-8 shrink-0"
              >
                {copied ? <Check aria-hidden className="text-success" /> : <Copy aria-hidden />}
              </Button>
            </div>
          </div>

          <ul className="flex list-disc flex-col gap-1 ps-4 text-xs text-muted-foreground">
            <li>{m.readme_how_prompt()}</li>
            <li>{isCard ? m.readme_how_html() : m.readme_how_markdown()}</li>
          </ul>
          <div className="grid gap-2 @sm:grid-cols-2 @xl:mt-auto @xl:grid-cols-1">
            <Button onClick={() => copy("prompt")}>
              <Bot aria-hidden />
              {m.readme_copy_prompt()}
            </Button>
            <Button variant="secondary" onClick={() => copy("markdown")}>
              <Code aria-hidden />
              {copyLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
