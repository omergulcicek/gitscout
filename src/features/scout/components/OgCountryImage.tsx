import * as FLAG_SVGS from "country-flag-icons/string/3x2"

import { OG_FONT_FAMILY } from "@/lib/og-image"

import { OgLink } from "@/features/scout/components/OgLink"
import { OgPlayerCardMedium } from "@/features/scout/components/OgPlayerCardMedium"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { countryName } from "@/features/scout/helpers/player-country"
import type { CountryTop } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/**
 * Link preview for a country page (1200×630). An open page shows its top four as cards; a page still
 * short of developers shows how close it is and who is there so far, so an invite link explains itself.
 * Drawn with Satori: flex layout and inline styles only.
 */

const GOLD = "#f6d77c"
const MUTED = "#a3a3a3"
/** How many of the open page's top players get a card. */
export const OG_COUNTRY_CARDS = 4
/** How many avatars a locked page shows. */
export const OG_COUNTRY_AVATARS = 10

type OgCountryImageProps = {
  top: CountryTop
  /** Avatars of `top.players` in order, as many as the layout shows. */
  avatars: (string | null)[]
}

export function OgCountryImage({ top, avatars }: OgCountryImageProps) {
  const name = countryName(top.country)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: "0 72px",
        backgroundColor: "#0b0b0c",
        backgroundImage: "radial-gradient(circle at 600px 360px, #1c1c22, #0b0b0c 560px)",
        color: "#fafafa",
        fontFamily: OG_FONT_FAMILY
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Flag country={top.country} />
          <div
            style={{
              display: "flex",
              fontSize: 36,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              maxWidth: 960
            }}
          >
            {top.unlocked
              ? m.top_country_title({ country: name, count: top.players.length })
              : m.top_locked_title({ country: name })}
          </div>
        </div>
      </div>

      {top.unlocked ? (
        <Podium top={top} avatars={avatars} />
      ) : (
        <Progress top={top} avatars={avatars} />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22 }}>
        <span>{top.unlocked ? m.cta_title() : m.top_make_card()}</span>
        <OgLink />
      </div>
    </div>
  )
}

function Podium({ top, avatars }: OgCountryImageProps) {
  // Left-aligned with the title; the four cards fit between the safe margins.
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {top.players.slice(0, OG_COUNTRY_CARDS).map((player, index) => (
        <div
          key={player.login}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <div style={{ display: "flex", fontSize: 18, fontWeight: 800, color: MUTED }}>
            #{player.rank}
          </div>
          <OgPlayerCardMedium player={player} avatar={avatars[index] ?? null} signature={false} />
        </div>
      ))}
    </div>
  )
}

function Progress({ top, avatars }: OgCountryImageProps) {
  const name = countryName(top.country)
  const missing = Math.max(0, top.min - top.total)
  const percent = Math.min(100, Math.round((top.total / top.min) * 100))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: GOLD }}>
          {top.total}/{top.min}
        </div>
        {/* A fixed width: Satori lets a flexible bar run past the safe margin. */}
        <div style={{ display: "flex", flexDirection: "column", width: 740, gap: 14 }}>
          <div
            style={{
              display: "flex",
              height: 14,
              borderRadius: 999,
              backgroundColor: "#262626"
            }}
          >
            <div
              style={{
                display: "flex",
                width: `${percent}%`,
                height: 14,
                borderRadius: 999,
                backgroundColor: GOLD
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#d8d8d8" }}>
            {m.top_missing({ missing, country: name })}
          </div>
        </div>
      </div>
      {/* Faces of the developers already there make the invite feel like joining people, not a counter. */}
      <div style={{ display: "flex", gap: 12 }}>
        {top.players.slice(0, OG_COUNTRY_AVATARS).map((player, index) => {
          const avatar = avatars[index]
          return avatar ? (
            <img
              key={player.login}
              src={avatar}
              width={72}
              height={72}
              style={{ borderRadius: 999, border: "3px solid #2a2a2a" }}
            />
          ) : (
            <div
              key={player.login}
              style={{
                display: "flex",
                width: 72,
                height: 72,
                borderRadius: 999,
                backgroundColor: "#262626"
              }}
            />
          )
        })}
      </div>
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
      <span style={{ color: GOLD }}>{m.footer_top().toLocaleUpperCase(getLocale())}</span>
    </div>
  )
}

/** The country flag from the same flag set the site uses, as an embedded SVG. */
function Flag({ country }: { country: CountryCode }) {
  const svg = (FLAG_SVGS as Record<string, string>)[country]
  if (!svg) return null
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`
  return <img src={src} width={60} height={40} style={{ borderRadius: 6 }} />
}
