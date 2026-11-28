import * as FLAG_SVGS from "country-flag-icons/string/3x2"

import { OG_FONT_FAMILY } from "@/lib/og-image"

import { OgLink } from "@/features/scout/components/OgLink"
import { RARITY_COLORS } from "@/features/scout/components/OgPlayerCard"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { countryName } from "@/features/scout/helpers/player-country"
import type { CountryTop, RankedPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/**
 * Link preview for a country page (1200×630): the country's developers as faces, biggest at the top of
 * the ranking and smaller further down, so "top 100" reads as a crowd rather than four cards. The same
 * layout serves open and locked countries. Drawn with Satori: flex layout and inline styles only.
 */

const GOLD = "#f6d77c"
const MUTED = "#a3a3a3"

/**
 * Rows of faces from the top of the ranking down: how many fit in each row and how big they are.
 * The first row also shows ratings and names. Satori adds the ring to the size, so the counts are
 * worked out with it to stay inside the 1008px between the safe margins.
 */
const TIERS = [
  { count: 4, size: 104, gap: 12 },
  { count: 13, size: 60, gap: 10 },
  { count: 16, size: 48, gap: 10 },
  { count: 20, size: 38, gap: 8 }
] as const

/** Side margin kept clear: platforms crop previews at the edges, some to a square. */
const SAFE_X = 96

/** Width of one of the top four: the face, its ring and room for a name next to it. */
const LEADER_WIDTH = 243

/** How many faces the preview draws. */
export const OG_COUNTRY_FACES = TIERS.reduce((sum, tier) => sum + tier.count, 0)

/** Avatar size to fetch for the face at `index`: the top four are drawn big, the rest small. */
export const ogCountryAvatarSize = (index: number) => (index < TIERS[0].count ? 224 : 120)

type OgCountryImageProps = {
  top: CountryTop
  /** Avatars of `top.players` in order, up to `OG_COUNTRY_FACES`. */
  avatars: (string | null)[]
}

export function OgCountryImage({ top, avatars }: OgCountryImageProps) {
  const name = countryName(top.country)
  const title = top.unlocked
    ? m.top_country_title({ country: name, count: top.players.length })
    : m.top_locked_title({ country: name })
  const rows = splitIntoTiers(top.players)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 22,
        padding: `0 ${SAFE_X}px`,
        backgroundColor: "#0b0b0c",
        backgroundImage: "radial-gradient(circle at 600px 330px, #1c1c22, #0b0b0c 560px)",
        color: "#fafafa",
        fontFamily: OG_FONT_FAMILY
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Flag country={top.country} />
          <div
            style={{
              display: "flex",
              fontSize: titleSize(title),
              fontWeight: 800,
              letterSpacing: -0.5
            }}
          >
            {title}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(({ players, size, gap, offset }, tier) => (
          <div key={offset} style={{ display: "flex", gap, marginBottom: tier === 0 ? 8 : 0 }}>
            {players.map((player, index) =>
              tier === 0 ? (
                <Leader key={player.login} player={player} avatar={avatars[index] ?? null} />
              ) : (
                <Face
                  key={player.login}
                  player={player}
                  avatar={avatars[offset + index] ?? null}
                  size={size}
                />
              )
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22 }}>
        <span>{m.cta_title()}</span>
        <OgLink />
      </div>
    </div>
  )
}

/** Long country names step the title down so it stays on one line next to the flag. */
function titleSize(title: string): number {
  if (title.length <= 40) return 36
  if (title.length <= 48) return 32
  return 28
}

type TierRow = { players: RankedPlayer[]; size: number; gap: number; offset: number }

function splitIntoTiers(players: RankedPlayer[]): TierRow[] {
  const rows: TierRow[] = []
  let offset = 0
  for (const tier of TIERS) {
    const row = players.slice(offset, offset + tier.count)
    if (row.length === 0) break
    rows.push({ players: row, size: tier.size, gap: tier.gap, offset })
    offset += tier.count
  }
  return rows
}

/** One of the top four: a big face with its rating on a chip in the card's colors, the rank and name. */
function Leader({ player, avatar }: { player: RankedPlayer; avatar: string | null }) {
  const colors = RARITY_COLORS[player.rarity]
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: LEADER_WIDTH }}>
      <Face player={player} avatar={avatar} size={TIERS[0].size} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 119 }}>
        {/* Built like the site's rating chip: the card's frame around its face, so the ink always contrasts. */}
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: 2,
            borderRadius: 9,
            backgroundImage: `linear-gradient(145deg, ${colors.frame[0]}, ${colors.frame[1]})`
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "2px 8px",
              borderRadius: 7,
              fontSize: 18,
              fontWeight: 800,
              color: colors.ink,
              backgroundImage: `linear-gradient(135deg, ${colors.face[0]}, ${colors.face[1]})`
            }}
          >
            {String(player.ovr)}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 14, fontWeight: 800, color: MUTED }}>
          #{player.rank}
        </div>
        <div
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {player.name}
        </div>
      </div>
    </div>
  )
}

type FaceProps = { player: RankedPlayer; avatar: string | null; size: number }

/** A round face ringed in the card's color, so the crowd still shows Icon, Gold, Silver and Bronze. */
function Face({ player, avatar, size }: FaceProps) {
  const ring = RARITY_COLORS[player.rarity].frame[0]
  const border = size >= 100 ? 4 : size >= 50 ? 3 : 2
  return avatar ? (
    <img
      src={avatar}
      width={size}
      height={size}
      style={{ borderRadius: 999, border: `${border}px solid ${ring}` }}
    />
  ) : (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: 999,
        border: `${border}px solid ${ring}`,
        backgroundColor: "#262626"
      }}
    />
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
  return <img src={src} width={54} height={36} style={{ borderRadius: 6 }} />
}
