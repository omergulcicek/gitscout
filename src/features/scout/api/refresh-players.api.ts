import { timingSafeEqual } from "node:crypto"

import { fetchPlayerFacts } from "@/features/scout/api/fetch-player-facts.api"
import { GithubError } from "@/features/scout/api/get-github-data.api"
import {
  getStaleLogins,
  postponePlayer,
  replacePlayerFacts
} from "@/features/scout/api/player-store"
import { REFRESH } from "@/features/scout/constants/scoring.constants"
import { serverEnv } from "@/env.server"

/** Vercel Cron `Authorization: Bearer <CRON_SECRET>` gönderir; karşılaştırma sabit sürede yapılır. */
export function isAuthorizedCron(header: string | null): boolean {
  const secret = serverEnv.CRON_SECRET
  if (!secret || !header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

type RefreshResult = {
  refreshed: string[]
  postponed: string[]
  failed: string[]
  /** Süre dolduğu ya da GitHub kotası bittiği için bu çalışmada denenmeyenler; sonraki çalışmada sıradalar. */
  skipped: string[]
}

/** Kota ya da token hatası bir sonraki kartta da tekrarlanır; çalışma orada durur. */
const isFatal = (error: unknown) =>
  error instanceof GithubError && (error.kind === "rate-limit" || error.kind === "missing-token")

/**
 * En eski kartları sırayla GitHub'dan yeniden çeker; süre ya da kart sınırı dolunca durur.
 * Bir kartın hatası diğerlerini durdurmaz, kota ya da token hatası ise çalışmayı bitirir.
 */
export async function refreshStalePlayers(
  clock: () => number = Date.now,
  timeBudgetMs: number = REFRESH.timeBudgetMs
): Promise<RefreshResult> {
  const result: RefreshResult = { refreshed: [], postponed: [], failed: [], skipped: [] }
  const startedAt = clock()
  const logins = await getStaleLogins(REFRESH.maxPerRun)

  for (const [index, login] of logins.entries()) {
    if (clock() - startedAt >= timeBudgetMs) {
      result.skipped.push(...logins.slice(index))
      break
    }
    try {
      const facts = await fetchPlayerFacts(login)
      await replacePlayerFacts(login, {
        login: facts.login,
        fetchedAt: new Date().toISOString(),
        facts
      })
      result.refreshed.push(login)
    } catch (error) {
      if (error instanceof GithubError && error.kind === "not-found") {
        await postponePlayer(login)
        result.postponed.push(login)
        continue
      }
      console.error("[refresh] yenilenemedi", login, error instanceof Error ? error.message : error)
      result.failed.push(login)
      if (isFatal(error)) {
        result.skipped.push(...logins.slice(index + 1))
        break
      }
    }
  }
  return result
}
