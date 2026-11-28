import * as m from "@/paraglide/messages.js"

/**
 * What happens to the season page and when (UTC days), so people know to come back at the end of the
 * year. A step with `from` is a phase that lasts until the next phase starts; `date` is the day its text
 * names in bold. A step without `from` is a note, never marked as the current one.
 */
export const SEASON_TIMELINE: readonly {
  from?: string
  date?: string
  title: () => string
  text: (inputs: { date: string }) => string
}[] = [
  {
    from: "2026-11-28",
    date: "2026-12-31",
    title: m.season_step_preview,
    text: m.season_step_preview_text
  },
  {
    from: "2027-01-02",
    date: "2027-01-02",
    title: m.season_step_frozen,
    text: m.season_step_frozen_text
  },
  { title: m.season_step_archive, text: m.season_step_archive_text }
]
