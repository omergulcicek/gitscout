import { ogStatColor, RARITY_COLORS } from "@/features/scout/components/OgPlayerCard"
import { BADGE_CARD_SIZES, BADGE_SIGNATURE } from "@/features/scout/constants/badge.constants"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { statShort, titleText } from "@/features/scout/helpers/player-text"
import type { ListPlayer } from "@/features/scout/types/player.types"
import type { Locale } from "@/paraglide/runtime.js"

/** Dış çerçevenin kalınlığı. */
const FRAME = 6

type OgPlayerCardMediumProps = {
  player: ListPlayer
  avatar: string | null
  /** Kart metinlerinin dili; verilmezse isteğin dili. Tarayıcıdaki README önizlemesi rozet dilini verir. */
  locale?: Locale
}

/**
 * Sitedeki `PlayerCardMedium` düzeninin Satori sürümü: avatar ve puan üstte, ad ve unvan ortada,
 * altı stat 3×2 ızgarada. Satori yalnızca flex düzen ve satır içi stil desteklediği için ayrı yazılır.
 */
export function OgPlayerCardMedium({ player, avatar, locale }: OgPlayerCardMediumProps) {
  const colors = RARITY_COLORS[player.rarity]

  return (
    <div
      style={{
        display: "flex",
        // Satori dolguyu ölçüye ekler (content-box): çerçeve payı düşülmezse kart görselden taşar ve
        // sağdan, alttan kırpılır.
        width: BADGE_CARD_SIZES.medium.width - FRAME * 2,
        height: BADGE_CARD_SIZES.medium.height - FRAME * 2,
        padding: FRAME,
        borderRadius: 18,
        backgroundImage: `linear-gradient(145deg, ${colors.frame[0]}, ${colors.frame[1]})`
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          borderRadius: 13,
          padding: "12px 12px 10px",
          color: colors.ink,
          backgroundImage: `linear-gradient(135deg, ${colors.face[0]}, ${colors.face[1]})`
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {avatar ? (
            <img
              src={avatar}
              width={56}
              height={56}
              style={{ borderRadius: 999, border: `3px solid ${colors.frame[1]}` }}
            />
          ) : (
            <div
              style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.muted }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 0.9, letterSpacing: -1.5 }}>
              {String(player.ovr)}
            </div>
            <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>
              {player.position.toUpperCase()}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "block",
            marginTop: 10,
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {player.name}
        </div>
        <div
          style={{
            display: "block",
            marginTop: 2,
            fontSize: 11,
            color: colors.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {titleText(player.title, locale)}
        </div>

        <div
          style={{
            display: "flex",
            height: 1,
            backgroundColor: colors.muted,
            margin: "10px 0 8px",
            opacity: 0.4
          }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", rowGap: 8 }}>
          {STAT_ORDER.map((key) => {
            const value = player.stats[key].value
            return (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "33.33%"
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: colors.muted }}>
                  {statShort(key, locale)}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: ogStatColor(player.rarity, value)
                  }}
                >
                  {String(value)}
                </div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 10,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            color: colors.muted
          }}
        >
          {BADGE_SIGNATURE}
        </div>
      </div>
    </div>
  )
}
