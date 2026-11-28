import { useState } from "react"

import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { trackEvent } from "@/lib/analytics"

import { Button } from "@/components/ui/button"
import { GithubLight } from "@/components/ui/svgs/githubLight"
import { Linkedin } from "@/components/ui/svgs/linkedin"
import { X } from "@/components/ui/svgs/x"
import { XDark } from "@/components/ui/svgs/xDark"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReadmeBadgeContent } from "@/features/scout/components/ReadmeBadgeSection"
import { shareText } from "@/features/scout/helpers/share-text"
import { shareLocaleSchema, shareTabSchema } from "@/features/scout/schemas/share.schema"
import type { ShareLocale, SharePlatform, ShareTab } from "@/features/scout/schemas/share.schema"
import type { PlayerDetail } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale, locales } from "@/paraglide/runtime.js"

/** Kopyalandı işaretinin ekranda kalma süresi. */
const COPIED_MS = 2000

const TAB_LABELS = {
  linkedin: () => "LinkedIn",
  x: () => "X",
  readme: m.readme_badge
} as const satisfies Record<ShareTab, () => string>

/** Sekme logosu; X ve GitHub'ın koyu logoları koyu temada beyaza döner. */
export function TabLogo({ tab }: { tab: ShareTab }) {
  if (tab === "linkedin") return <Linkedin aria-hidden className="size-3.5" />
  if (tab === "readme") return <GithubLight aria-hidden className="size-3.5 dark:invert" />
  return (
    <>
      <X aria-hidden className="size-3.5 dark:hidden" />
      <XDark aria-hidden className="hidden size-3.5 dark:block" />
    </>
  )
}

/**
 * Kartı paylaşmanın üç yolu tek kutuda: LinkedIn ve X için kopyalanacak hazır metin (dili
 * sayfadan bağımsız seçilir) ve profil README'sine eklenecek rozet.
 */
export function ShareTextSection({ id, player }: { id?: string; player: PlayerDetail }) {
  const [tab, setTab] = useState<ShareTab>("linkedin")
  const [locale, setLocale] = useState<ShareLocale>(getLocale())

  return (
    <section
      id={id}
      aria-labelledby="share-text-heading"
      className="surface mx-auto flex w-full max-w-3xl scroll-mt-20 flex-col gap-4 px-5 py-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="share-text-heading" className="text-lg font-semibold">
          {m.share_heading()}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">
          {tab === "readme" ? m.readme_badge_hint() : m.share_hint()}
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          const parsed = shareTabSchema.safeParse(value)
          if (parsed.success) setTab(parsed.data)
        }}
      >
        <TabsList aria-label={m.share_platform_label()} className="w-full">
          {shareTabSchema.options.map((item) => (
            <TabsTrigger key={item} value={item}>
              <TabLogo tab={item} />
              {TAB_LABELS[item]()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "readme" ? (
        <ReadmeBadgeContent player={player} />
      ) : (
        <SharePost
          login={player.login}
          text={shareText(player, tab, locale)}
          platform={tab}
          locale={locale}
          onLocaleChange={setLocale}
        />
      )}
    </section>
  )
}

type SharePostProps = {
  /** Whose card is shared, for the analytics event. */
  login: string
  text: string
  platform: SharePlatform
  locale: ShareLocale
  onLocaleChange: (locale: ShareLocale) => void
}

/** Seçilen platformun hazır metni, sağ üstünde dil seçimi ve kopyalama butonu. */
export function SharePost({ login, text, platform, locale, onLocaleChange }: SharePostProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    trackEvent({ name: "card_shared", login, target: `copy_${platform}` })
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), COPIED_MS)
        toast.success(m.share_copied())
      })
      .catch(() => toast.error(m.share_copy_failed()))
  }

  return (
    <>
      {/* Dil seçimi metnin sağ üstünde yüzer; satırlar onun çevresinden akar, üstte boşluk kalmaz. */}
      <div className="rounded-md border bg-background px-3 py-2.5 text-sm leading-relaxed">
        <Tabs
          value={locale}
          onValueChange={(value) => {
            const parsed = shareLocaleSchema.safeParse(value)
            if (parsed.success) onLocaleChange(parsed.data)
          }}
          className="float-end ms-3 -me-1.5 -mt-1 mb-1"
        >
          <TabsList aria-label={m.share_lang_label()}>
            {locales.map((item) => (
              <TabsTrigger key={item} value={item} lang={item} className="px-2.5 font-mono text-xs">
                {item.toLocaleUpperCase("en")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p lang={locale} className="whitespace-pre-wrap">
          {text}
        </p>
      </div>

      <Button onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {m.share_copy()}
      </Button>

      {platform === "linkedin" ? (
        <p className="text-xs text-pretty text-muted-foreground">{m.share_linkedin_tip()}</p>
      ) : null}
    </>
  )
}
