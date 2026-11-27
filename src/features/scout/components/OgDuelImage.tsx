import type { ReactNode } from "react"

import { OG_FONT_FAMILY } from "@/lib/og-image"

import { OgLink } from "@/features/scout/components/OgLink"
import { OgPlayerCard } from "@/features/scout/components/OgPlayerCard"
import { computeDuel } from "@/features/scout/helpers/duel"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/**
 * Link preview for a duel (1200×630): two cards leaning towards each other and, between them, the swords badge, the score and
 * who won. The stats are readable on the cards, so they aren't listed again.
 * Drawn with Satori: flex layout, absolute positions and inline styles only.
 */

/** Cards are drawn smaller so a ~64px safe area stays free on every side; platforms may crop edges. */
const CARD_SCALE = 0.86
const GOLD = "#f6d77c"
const MUTED = "#737373"

type OgDuelImageProps = {
  left: ScoredPlayer
  right: ScoredPlayer
  leftAvatar: string | null
  rightAvatar: string | null
}

export function OgDuelImage({ left, right, leftAvatar, rightAvatar }: OgDuelImageProps) {
  const { score, winner, decidedBy } = computeDuel(left, right)
  const winnerName = winner === "left" ? left.name : winner === "right" ? right.name : null

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
      <Absolute left={72} top={56}>
        <Brand />
      </Absolute>
      <Absolute left={96} top={100} rotate={8} scale={CARD_SCALE}>
        <OgPlayerCard player={left} avatar={leftAvatar} />
      </Absolute>
      <Absolute left={804} top={100} rotate={-8} scale={CARD_SCALE}>
        <OgPlayerCard player={right} avatar={rightAvatar} />
      </Absolute>
      <Absolute left={400} top={150} width={400} center>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SwordsBadge />
          <div style={{ display: "flex", marginTop: 30 }}>
            <Score score={score} winner={winner} />
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              maxWidth: 380,
              textAlign: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.3,
              color: winnerName ? GOLD : "#d8d8d8"
            }}
          >
            {winnerName ? m.duel_winner({ name: winnerName }) : m.duel_draw()}
          </div>
          {/* A level score decided by the decimal overall rating; without this note "3 – 3" reads like a draw. */}
          {decidedBy === "ovr" ? (
            <div style={{ display: "flex", marginTop: 8, fontSize: 17, color: MUTED }}>
              {m.duel_overtime_note({
                left: decimal(left.ovrExact),
                right: decimal(right.ovrExact)
              })}
            </div>
          ) : null}
          <div style={{ display: "flex", marginTop: 40 }}>
            <OgLink />
          </div>
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

type ScoreProps = {
  score: { left: number; right: number }
  winner: "left" | "right" | null
}

/** The winning side's count is gold and the other is muted; a draw keeps both bright. */
function Score({ score, winner }: ScoreProps) {
  const color = (side: "left" | "right") =>
    winner === null ? "#fafafa" : winner === side ? GOLD : MUTED
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        fontSize: 84,
        fontWeight: 800,
        lineHeight: 1
      }}
    >
      <span style={{ color: color("left") }}>{String(score.left)}</span>
      <span style={{ fontSize: 48, color: "#525252" }}>–</span>
      <span style={{ color: color("right") }}>{String(score.right)}</span>
    </div>
  )
}

/** Lucide's "swords" in the same gold ring as the static duel preview. */
function SwordsBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 96,
        height: 96,
        borderRadius: 999,
        backgroundColor: "#0b0b0c",
        border: `4px solid ${GOLD}`,
        boxShadow: "0 0 50px rgba(246,215,124,0.3)"
      }}
    >
      <svg
        width={46}
        height={46}
        viewBox="0 0 24 24"
        fill="none"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m13 19 6-6" />
        <path d="M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5" />
        <path d="m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586" />
        <path d="m16 16 4 4" />
        <path d="m19 21 2-2" />
        <path d="m5 14 4 4" />
        <path d="m5 21-2-2" />
        <path d="M7.5 16.5 4 20" />
      </svg>
    </div>
  )
}

function Brand() {
  return (
    <div
      style={{ display: "flex", fontSize: 18, fontWeight: 800, letterSpacing: 4, color: "#d8d8d8" }}
    >
      GITSCOUT
      <span style={{ color: "#6b6b6b", margin: "0 12px" }}>/</span>
      <span style={{ color: GOLD }}>{m.duel_title().toLocaleUpperCase(getLocale())}</span>
    </div>
  )
}

/** Overall rating with two decimals and the locale's separator (89,64 / 89.64), as on the duel page. */
function decimal(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
