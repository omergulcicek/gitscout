import type { ReactNode } from "react"

import { OG_FONT_FAMILY } from "@/lib/og-image"

import {
  DUEL_AWAY_COLOR,
  DUEL_HOME_COLOR,
  OgDuelRadar
} from "@/features/scout/components/OgDuelRadar"
import { OgLink } from "@/features/scout/components/OgLink"
import { OgPlayerCard } from "@/features/scout/components/OgPlayerCard"
import { computeDuel } from "@/features/scout/helpers/duel"
import type { ScoredPlayer } from "@/features/scout/types/player.types"

/**
 * Düello sayfasının link önizlemesi (1200×630): masaya atılmış gibi eğik iki kart, ortada grafik,
 * altında skor ve link. Statlar kartların üzerinde okunduğu için ayrıca listelenmez.
 * Satori ile çizilir: yalnızca flex düzen, mutlak konum ve satır içi stil desteklenir.
 */

/**
 * Kartlar küçültülerek çizilir; platformlar görselin kenarlarını kırpabildiği için her yanda
 * en az ~64px boşluk (güvenli alan) kalır.
 */
const CARD_SCALE = 0.86

type OgDuelImageProps = {
  left: ScoredPlayer
  right: ScoredPlayer
  leftAvatar: string | null
  rightAvatar: string | null
}

export function OgDuelImage({ left, right, leftAvatar, rightAvatar }: OgDuelImageProps) {
  const { score } = computeDuel(left, right)

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0b0b0c",
        backgroundImage: "radial-gradient(circle at 600px 300px, #1c1c22, #0b0b0c 520px)",
        color: "#fafafa",
        fontFamily: OG_FONT_FAMILY
      }}
    >
      <Absolute left={72} top={60}>
        <Brand />
      </Absolute>
      <Absolute left={460} top={88}>
        <OgDuelRadar left={left} right={right} size={280} />
      </Absolute>
      <Absolute left={100} top={85} rotate={-9} scale={CARD_SCALE}>
        <OgPlayerCard player={left} avatar={leftAvatar} />
      </Absolute>
      <Absolute left={780} top={62} rotate={7} scale={CARD_SCALE}>
        <OgPlayerCard player={right} avatar={rightAvatar} />
      </Absolute>
      <Absolute left={400} top={384} width={400} center>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
          <Score score={score} size={84} />
          <OgLink />
        </div>
      </Absolute>
    </div>
  )
}

type AbsoluteProps = {
  left: number
  top: number
  rotate?: number
  scale?: number
  width?: number
  center?: boolean
  children: ReactNode
}

function Absolute({ left, top, rotate, scale, width, center, children }: AbsoluteProps) {
  const transform = [rotate ? `rotate(${rotate}deg)` : "", scale ? `scale(${scale})` : ""]
    .filter(Boolean)
    .join(" ")
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left,
        top,
        width,
        justifyContent: center ? "center" : "flex-start",
        transform: transform || undefined
      }}
    >
      {children}
    </div>
  )
}

/** Sayılar grafikteki renklerle boyanır: hangi kartın hangi çizgi olduğu buradan okunur. */
function Score({ score, size }: { score: { left: number; right: number }; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.28,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1
      }}
    >
      <span style={{ color: DUEL_HOME_COLOR }}>{String(score.left)}</span>
      <span style={{ fontSize: size * 0.3, color: "#737373", letterSpacing: 2 }}>VS</span>
      <span style={{ color: DUEL_AWAY_COLOR }}>{String(score.right)}</span>
    </div>
  )
}

function Brand() {
  return (
    <div
      style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: 4, color: "#d8d8d8" }}
    >
      GITSCOUT
    </div>
  )
}
