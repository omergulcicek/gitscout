import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SharePost, TabLogo } from "@/features/scout/components/ShareTextSection"
import { seasonShareText } from "@/features/scout/helpers/season-share-text"
import type { SeasonShareInput } from "@/features/scout/helpers/season-share-text"
import { sharePlatformSchema } from "@/features/scout/schemas/share.schema"
import type { ShareLocale, SharePlatform } from "@/features/scout/schemas/share.schema"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

const PLATFORM_LABELS = {
  linkedin: "LinkedIn",
  x: "X"
} as const satisfies Record<SharePlatform, string>

/**
 * Ready-made LinkedIn and X posts about the season card, in the same box as the profile's: written for the
 * year's end while the season runs and as a look back once it is over.
 */
export function SeasonShareSection(props: SeasonShareInput) {
  const [platform, setPlatform] = useState<SharePlatform>("linkedin")
  const [locale, setLocale] = useState<ShareLocale>(getLocale())

  return (
    <section
      aria-labelledby="season-share-heading"
      className="surface mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-5"
    >
      <div className="flex flex-col gap-1">
        <h2 id="season-share-heading" className="text-lg font-semibold">
          {m.season_share_heading()}
        </h2>
        <p className="text-sm text-pretty text-muted-foreground">{m.season_share_hint()}</p>
      </div>

      <Tabs
        value={platform}
        onValueChange={(value) => {
          const parsed = sharePlatformSchema.safeParse(value)
          if (parsed.success) setPlatform(parsed.data)
        }}
      >
        <TabsList aria-label={m.share_platform_label()} className="w-full">
          {sharePlatformSchema.options.map((item) => (
            <TabsTrigger key={item} value={item}>
              <TabLogo tab={item} />
              {PLATFORM_LABELS[item]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SharePost
        login={props.card.login}
        text={seasonShareText(props, platform, locale)}
        platform={platform}
        locale={locale}
        onLocaleChange={setLocale}
      />
    </section>
  )
}
