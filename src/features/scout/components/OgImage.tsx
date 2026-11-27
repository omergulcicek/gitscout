import { OG_FONT_FAMILY } from "@/lib/og-image"

import { OgLink } from "@/features/scout/components/OgLink"
import { OgPlayerCard, RARITY_COLORS } from "@/features/scout/components/OgPlayerCard"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { rarityLabel, statLabel } from "@/features/scout/helpers/player-text"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/**
 * Link önizlemesi (1200×630). Satori ile çizilir: yalnızca flex düzen ve satır içi stil desteklenir.
 * Sıralama gibi sık değişen bilgiler bilerek yok; paylaşılan gönderide eski kalan görsel yanlış görünmesin.
 */

type OgImageProps = { player: ScoredPlayer; avatar: string | null }

export function OgImage({ player, avatar }: OgImageProps) {
  const colors = RARITY_COLORS[player.rarity]

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

      {/* Sağ taraf */}
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
        {/* İsim zaten kartın üzerinde; başlık tek satır, kim paylaşırsa paylaşsın doğru okunur. */}
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1 }}>
          {m.og_rating()}&nbsp;
          <span style={{ color: colors.frame[0] }}>{String(player.ovr)}</span>
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#a3a3a3" }}>
          {m.og_meta({ rarity: rarityLabel(player.rarity), position: player.position })}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", width: 640, rowGap: 14 }}>
          {STAT_ORDER.map((key) => (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column", width: 200, marginRight: 13 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  color: "#a3a3a3",
                  marginBottom: 6
                }}
              >
                <span>{statLabel(key)}</span>
                <span style={{ color: "#fafafa" }}>{String(player.stats[key].value)}</span>
              </div>
              <div
                style={{ display: "flex", height: 8, borderRadius: 99, backgroundColor: "#26262a" }}
              >
                <div
                  style={{
                    width: `${player.stats[key].value}%`,
                    height: 8,
                    borderRadius: 99,
                    backgroundColor: "#3f8fd8"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, marginTop: 6 }}>
          <span>{m.cta_title()}</span>
          <OgLink />
        </div>
      </div>
    </div>
  )
}
