import { OgPlayerCard } from "@/features/scout/components/OgPlayerCard"
import { OgPlayerCardMedium } from "@/features/scout/components/OgPlayerCardMedium"
import { BADGE_CARD_SIZES, BADGE_SIGNATURE } from "@/features/scout/constants/badge.constants"
import type { BadgeCardSize, BadgeLocale } from "@/features/scout/schemas/badge.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type BadgeCardPreviewProps = {
  player: ListPlayer
  size: BadgeCardSize
  locale: BadgeLocale
  /** Önizlemenin ekrandaki genişliği; kart bu genişliğe ölçeklenir. */
  width: number
}

/**
 * README kart rozetinin anlık önizlemesi. Sunucunun PNG'sini beklemek yerine aynı Satori
 * bileşenleri elimizdeki veriyle tarayıcıda çizilir. Görsel PNG ile birebir aynı olsun diye Satori'nin
 * (Yoga) varsayılanları taklit edilir: dolgu ölçüye eklenir (content-box), öğeler küçülmez
 * (flex-shrink 0) ve satır yüksekliği normaldir.
 */
export function BadgeCardPreview({ player, size, locale, width }: BadgeCardPreviewProps) {
  const natural = BADGE_CARD_SIZES[size]
  const scale = width / natural.width

  return (
    <div
      role="img"
      aria-label={m.readme_badge_preview({ username: player.login })}
      style={{ width, height: Math.round(natural.height * scale) }}
      className="shrink-0"
    >
      <div
        aria-hidden
        lang={locale}
        style={{ width: natural.width, transform: `scale(${scale})`, transformOrigin: "top left" }}
        className="flex font-mono leading-[normal] [&_*]:box-content [&_*]:shrink-0"
      >
        {size === "medium" ? (
          <OgPlayerCardMedium player={player} avatar={player.avatarUrl} locale={locale} />
        ) : (
          <OgPlayerCard
            player={player}
            avatar={player.avatarUrl}
            signature={BADGE_SIGNATURE}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}
