import { fetchSeasonCalendar, GithubError } from "@/features/scout/api/get-github-data.api"
import {
  getFreezeInputs,
  getUnfrozenLogins,
  insertFrozenSeason
} from "@/features/scout/api/player-store"
import { SEASON_FREEZE } from "@/features/scout/constants/scoring.constants"
import { toListPlayer } from "@/features/scout/helpers/list-player"
import { isFreezeWindow, seasonCounts } from "@/features/scout/helpers/season-freeze"
import type { FrozenSeason } from "@/features/scout/types/season.types"

/**
 * Local development runs against the live database and neither role can delete a row, so a season is
 * never written from a dev server; it is built and returned only.
 */
const PERSIST_SEASONS = !import.meta.env.DEV

type FreezeOptions = { now: Date; db: "app" | "refresh" }

/**
 * Freezes one player's closed season from GitHub's calendar for that exact year. Null outside the
 * freezing window (January of the next year), when the player isn't stored, or when GitHub's calendar
 * doesn't cover the whole year.
 */
export async function freezeSeason(
  login: string,
  year: number,
  { now, db }: FreezeOptions
): Promise<FrozenSeason | null> {
  if (!isFreezeWindow(year, now)) return null
  const inputs = await getFreezeInputs(login, db)
  if (!inputs) return null
  const calendar = await fetchSeasonCalendar(inputs.login, year)
  const counts = seasonCounts(calendar.days, year)
  if (!counts) return null

  // Read-time extras describe the day the card is viewed, not the season.
  const {
    verified: _verified,
    birthdayToday: _birthday,
    womensDayToday: _womensDay,
    cardFace: _cardFace,
    ...card
  } = toListPlayer(inputs.scored)
  const row: FrozenSeason = {
    format: 1,
    login: inputs.login,
    githubId: calendar.githubId,
    year,
    counts,
    total: calendar.total,
    reviews: calendar.reviews,
    yearly: inputs.yearly,
    card
  }
  if (PERSIST_SEASONS) await insertFrozenSeason(row, db)
  return row
}

type FreezeRunResult = { frozen: string[]; failed: string[]; skipped: number }

const isFatal = (error: unknown) =>
  error instanceof GithubError && (error.kind === "rate-limit" || error.kind === "missing-token")

/**
 * The hourly job's share: freezes a few players' closed season until the time or player cap runs out.
 * Does nothing outside January, so it costs a single date check for the rest of the year.
 */
export async function freezeClosedSeasons(
  year: number,
  clock: () => number = Date.now
): Promise<FreezeRunResult> {
  const result: FreezeRunResult = { frozen: [], failed: [], skipped: 0 }
  const startedAt = clock()
  if (!isFreezeWindow(year, new Date(startedAt))) return result
  const logins = await getUnfrozenLogins(year, SEASON_FREEZE.maxPerRun)

  for (const [index, login] of logins.entries()) {
    if (clock() - startedAt >= SEASON_FREEZE.timeBudgetMs) {
      result.skipped = logins.length - index
      break
    }
    try {
      const row = await freezeSeason(login, year, { now: new Date(clock()), db: "refresh" })
      if (row) result.frozen.push(login)
      else result.failed.push(login)
    } catch (error) {
      console.error("[season] not frozen", login, error instanceof Error ? error.message : error)
      result.failed.push(login)
      if (isFatal(error)) {
        result.skipped = logins.length - index - 1
        break
      }
    }
  }
  return result
}
