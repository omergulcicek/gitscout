import * as m from "@/paraglide/messages.js"

/**
 * What happens to the season page and when (UTC days). The page lists them so people know to come back
 * at the end of the year. Each step lasts from `from` until the next one starts; `date` is the day its
 * text names.
 */
export const SEASON_TIMELINE = [
  {
    from: "2026-11-28",
    date: "2026-12-31",
    title: m.season_step_preview,
    text: m.season_step_preview_text
  },
  {
    from: "2026-12-31",
    date: "2026-12-31",
    title: m.season_step_whistle,
    text: m.season_step_whistle_text
  },
  {
    from: "2027-01-02",
    date: "2027-01-02",
    title: m.season_step_frozen,
    text: m.season_step_frozen_text
  }
] as const
