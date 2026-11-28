import { OG_FONT_FAMILY } from "@/lib/og-image"

import { OgLink } from "@/features/scout/components/OgLink"
import { OgPlayerCard, RARITY_COLORS } from "@/features/scout/components/OgPlayerCard"
import { drawableName, fitCardName } from "@/features/scout/helpers/card-name"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/**
 * Link önizlemesi (1200×630). Satori ile çizilir: yalnızca flex düzen ve satır içi stil desteklenir.
 * Sıralama gibi sık değişen bilgiler bilerek yok; paylaşılan gönderide eski kalan görsel yanlış görünmesin.
 */

type OgImageProps = { player: ScoredPlayer; avatar: string | null }

export function OgImage({ player, avatar }: OgImageProps) {
  const colors = RARITY_COLORS[player.rarity]
  const name = fitCardName(drawableName(player.name, player.login), "full")

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 64,
        padding: "0 72px",
        backgroundColor: "#0b0b0c",
        backgroundImage: `radial-gradient(circle at 300px 315px, ${colors.frame[1]}55, transparent 380px)`,
        color: "#fafafa",
        fontFamily: OG_FONT_FAMILY
      }}
    >
      <OgPlayerCard player={player} avatar={avatar} />

      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 4,
            color: "#d8d8d8"
          }}
        >
          GITSCOUT
        </div>
        {/* The name is the headline: in a small feed preview the card's own text is too small to read. */}
        <div
          style={{
            display: "flex",
            fontSize: nameSize(name),
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: -0.5,
            maxWidth: 620
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#a3a3a3" }}>
          {m.og_meta({ rarity: rarityLabel(player.rarity), position: player.position })}
        </div>
        <div style={{ display: "flex", marginTop: 18 }}>
          <OgLink />
        </div>
      </div>
    </div>
  )
}

/** Long names step down so they stay on one or two lines next to the card. */
function nameSize(name: string): number {
  if (name.length <= 14) return 64
  if (name.length <= 22) return 52
  return 42
}
