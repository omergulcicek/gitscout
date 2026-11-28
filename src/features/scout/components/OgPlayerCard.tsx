import { BADGE_CARD_SIZES } from "@/features/scout/constants/badge.constants"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { STAT_PIP_COUNT, STAT_TIER_PIPS } from "@/features/scout/constants/stat-tier.constants"
import { drawableName, drawableText, fitCardName } from "@/features/scout/helpers/card-name"
import { clubLabel, rarityLabel, statShort, titleText } from "@/features/scout/helpers/player-text"
import { statTier } from "@/features/scout/helpers/stat-tier"
import { VERIFIED_ON_CARD, VerifiedMark } from "@/features/scout/icons/VerifiedMark"
import type { ListPlayer, Rarity } from "@/features/scout/types/player.types"
import type { Locale } from "@/paraglide/runtime.js"

/**
 * Link önizlemelerindeki oyuncu kartı, sitedeki kartla aynı ölçüde (320×480). Oyuncu ve düello görselleri ile README'nin tam kart
 * rozeti ortak kullanır. Avatar ve aralıklar sitedeki kartla aynı orantıda: alt satır `marginTop: auto`
 * ile dibe itildiği için içerik küçük kalırsa artan boşluk statların altında birikir.
 * Satori ile çizilir: yalnızca flex düzen ve satır içi stil desteklenir.
 */

export const RARITY_COLORS: Record<
  Rarity,
  {
    frame: [string, string]
    face: [string, string]
    ink: string
    muted: string
    /** Colour of the rating, as `--card-accent` on the site: gold on Icon, the ink elsewhere. */
    accent: string
  }
> = {
  icon: {
    frame: ["#f6dc8c", "#a8832a"],
    face: ["#26242b", "#060607"],
    ink: "#f7f1e1",
    muted: "rgba(247,241,225,0.7)",
    accent: "#f3d27a"
  },
  gold: {
    frame: ["#fff1b3", "#b0820f"],
    face: ["#fde68a", "#e6b843"],
    ink: "#2e2100",
    muted: "rgba(46,33,0,0.74)",
    accent: "#2e2100"
  },
  silver: {
    frame: ["#f4f6f9", "#7f8996"],
    face: ["#f1f4f7", "#c2c9d2"],
    ink: "#161b22",
    muted: "rgba(22,27,34,0.72)",
    accent: "#161b22"
  },
  bronze: {
    frame: ["#f7d6b5", "#8f5428"],
    face: ["#f6d5b3", "#e3b68c"],
    ink: "#2b1406",
    muted: "rgba(43,20,6,0.74)",
    accent: "#2b1406"
  }
}

/** Stat values in the card's ink; a 90+ stat takes the rating's accent, as on the site card. */
export function ogStatValueColor(rarity: Rarity, value: number): string {
  const colors = RARITY_COLORS[rarity]
  return statTier(value) === "elite" ? colors.accent : colors.ink
}

/** Satori twin of the site's `StatPips`: five bars under a stat, the filled ones show its tier. */
export function OgStatPips({ rarity, value }: { rarity: Rarity; value: number }) {
  const filled = STAT_TIER_PIPS[statTier(value)]
  const ink = RARITY_COLORS[rarity].ink
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
      {Array.from({ length: STAT_PIP_COUNT }, (_, index) => (
        <div
          key={index}
          style={{
            width: 6,
            height: 3,
            borderRadius: 2,
            backgroundColor: ink,
            opacity: index < filled ? 1 : 0.2
          }}
        />
      ))}
    </div>
  )
}

type OgPlayerCardProps = {
  player: ListPlayer
  avatar: string | null
  /** Sağ alt köşede kullanıcı adı yerine yazılır; README kartı site adresini taşır. */
  signature?: string
  /** Kart metinlerinin dili; verilmezse isteğin dili. Tarayıcıdaki README önizlemesi rozet dilini verir. */
  locale?: Locale
}

/** Satori adds padding to the size (content-box), so the frame is taken off to land on the site's 320×480. */
const FRAME = 8

export function OgPlayerCard({ player, avatar, signature, locale }: OgPlayerCardProps) {
  const colors = RARITY_COLORS[player.rarity]
  const name = fitCardName(drawableName(player.name, player.login), "full")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: BADGE_CARD_SIZES.full.width - FRAME * 2,
        height: BADGE_CARD_SIZES.full.height - FRAME * 2,
        flexShrink: 0,
        padding: FRAME,
        borderRadius: 26,
        backgroundImage: `linear-gradient(145deg, ${colors.frame[0]}, ${colors.frame[1]})`
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "visible",
          borderRadius: 19,
          padding: "20px 20px 16px",
          color: colors.ink,
          backgroundImage: `linear-gradient(135deg, ${colors.face[0]}, ${colors.face[1]})`
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 60,
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: -2,
                color: colors.accent
              }}
            >
              {String(player.ovr)}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
              {player.position.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              padding: "4px 10px",
              borderRadius: 99,
              // Same tinted pill as the site's chip: a light wash of the ink with a thin ring.
              backgroundColor: `${colors.ink}29`,
              border: `1px solid ${colors.ink}59`
            }}
          >
            {rarityLabel(player.rarity, locale).toUpperCase()}
          </div>
        </div>

        {/* Same portrait as the site card: a 124px photo inside a 134px ring. */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          {avatar ? (
            // A gap in the face colour, then a ring in the frame's metal, like the site's portrait.
            <div
              style={{
                display: "flex",
                padding: 2,
                borderRadius: 999,
                backgroundImage: `linear-gradient(145deg, ${colors.frame[0]}, ${colors.frame[1]})`
              }}
            >
              <div
                style={{
                  display: "flex",
                  padding: 3,
                  borderRadius: 999,
                  backgroundColor: colors.face[0]
                }}
              >
                <img src={avatar} width={124} height={124} style={{ borderRadius: 999 }} />
              </div>
            </div>
          ) : (
            <div
              style={{
                width: 134,
                height: 134,
                borderRadius: 999,
                backgroundColor: colors.muted
              }}
            />
          )}
        </div>

        {/* Names are fitted to two lines up front: Satori cannot clamp lines like the site does. */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            minHeight: 50,
            marginTop: 16,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.25,
            textAlign: "center"
          }}
        >
          <div style={{ display: "flex", maxWidth: 240 }}>{name}</div>
          {player.verified ? (
            <VerifiedMark size={18} color={VERIFIED_ON_CARD[player.rarity]} />
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 4,
            fontSize: 12,
            color: colors.muted
          }}
        >
          {titleText(player.title, locale)}
        </div>

        <div
          style={{
            display: "flex",
            height: 1,
            backgroundColor: colors.muted,
            margin: "16px 0 12px",
            opacity: 0.4
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {STAT_ORDER.map((key) => (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "4px 0"
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.muted }}>
                {statShort(key, locale)}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  color: ogStatValueColor(player.rarity, player.stats[key].value)
                }}
              >
                {String(player.stats[key].value)}
              </div>
              <OgStatPips rarity={player.rarity} value={player.stats[key].value} />
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1
          }}
        >
          <div
            style={{
              display: "block",
              maxWidth: 150,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {drawableText(clubLabel(player.club, locale)).toUpperCase()}
          </div>
          <div style={{ display: "flex" }}>{signature ?? `@${player.login}`}</div>
        </div>
      </div>
    </div>
  )
}
