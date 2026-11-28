import { localizedUrl } from "@/helpers/localized-url"

import { countryName } from "@/features/scout/helpers/player-country"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { SEASON_YEAR, seasonGrowth, standingTop } from "@/features/scout/helpers/season"
import type { Season, SeasonStanding } from "@/features/scout/helpers/season"
import type { ShareLocale, SharePlatform } from "@/features/scout/schemas/share.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

export type SeasonShareInput = {
  /** The season card: its rating, tier and field. */
  card: Pick<ListPlayer, "login" | "ovr" | "rarity" | "position">
  season: Season
  standing: SeasonStanding
  /** The season is over and frozen; otherwise it is still being counted. */
  final: boolean
}

/** The pool the standing is measured in, in the text's language. */
function poolLabel(standing: SeasonStanding, locale: ShareLocale): string {
  const { pool } = standing
  switch (pool.scope) {
    case "country-position":
      return `${countryName(pool.country, locale)} · ${pool.position}`
    case "country":
      return countryName(pool.country, locale)
    case "position":
      return pool.position
    case "all":
      return m.season_pool_all({}, { locale })
  }
}

/**
 * A ready-made post about the season card. It opens for the year's end while the season runs ("closing the
 * year") and as a look back once it is over; the LinkedIn version lists the season's numbers, the X version
 * fits in 280 characters (a link counts as 23). Lines with nothing to say (no growth, no standing) are left
 * out.
 */
export function seasonShareText(
  input: SeasonShareInput,
  platform: SharePlatform,
  locale: ShareLocale
): string {
  const { card, season, standing, final } = input
  const options = { locale }
  const format = new Intl.NumberFormat(locale)
  const year = season.year
  const query = year === SEASON_YEAR ? "" : `?year=${year}`
  const url = `${localizedUrl(`/u/${card.login}/season`, locale)}${query}`
  const rarity = rarityLabel(card.rarity, locale)
  const intro = final
    ? m.season_share_intro_final({ year }, options)
    : m.season_share_intro_live({ year }, options)
  const weeks = { active: season.activeWeeks, weeks: season.weeks.length }
  const contributions = format.format(season.contributions)

  if (platform === "x") {
    return m.season_share_x_text(
      { intro, ovr: card.ovr, rarity, role: card.position, ...weeks, contributions, year, url },
      options
    )
  }

  const growth = seasonGrowth(season)
  const top = standingTop(standing)
  const lines = [
    m.season_share_line_card({ ovr: card.ovr, rarity, role: card.position }, options),
    m.season_share_line_weeks(weeks, options),
    m.season_share_line_contributions({ contributions }, options),
    growth !== null && growth > 0 ? m.season_share_line_growth({ pct: growth }, options) : null,
    season.longestStreak > 0
      ? m.season_share_line_streak({ days: season.longestStreak }, options)
      : null,
    top === null
      ? null
      : m.season_share_line_standing({ pct: top, pool: poolLabel(standing, locale) }, options)
  ].filter((line) => line !== null)

  return [
    intro,
    lines.join("\n"),
    `${m.season_share_outro({ year }, options)}\n${url}`,
    m.season_share_tags({ year }, options)
  ].join("\n\n")
}
