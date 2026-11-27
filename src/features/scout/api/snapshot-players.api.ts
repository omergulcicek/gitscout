import {
  countUnsettledScores,
  getLatestSnapshot,
  insertSnapshot
} from "@/features/scout/api/player-store"
import { SCORE_VERSION, SNAPSHOT_INTERVAL_DAYS } from "@/features/scout/constants/scoring.constants"
import { snapshotDecision } from "@/features/scout/helpers/snapshot-decision"
import type { SnapshotDecision } from "@/features/scout/helpers/snapshot-decision"

type SnapshotResult =
  | { status: Exclude<SnapshotDecision, "due"> }
  | { status: "taken"; players: number }
  | { status: "failed" }

/**
 * Zamanı geldiyse bütün oyuncuların puanını ve sırasını geçmişe yazar. Saatlik yenileme işinden çağrılır;
 * tablo boşken (ilk deploy) ve formül sürümü değişince süre beklenmez. Hata yenilemeyi bozmaz: loglanır ve
 * sonuçta bildirilir, bir sonraki çalışmada yeniden denenir.
 */
export async function snapshotPlayers(clock: () => number = Date.now): Promise<SnapshotResult> {
  try {
    const decision = snapshotDecision({
      last: await getLatestSnapshot(),
      unsettled: await countUnsettledScores(),
      now: new Date(clock()),
      scoreVersion: SCORE_VERSION,
      intervalDays: SNAPSHOT_INTERVAL_DAYS
    })
    if (decision !== "due") return { status: decision }
    const players = await insertSnapshot(new Date(clock()))
    return players > 0 ? { status: "taken", players } : { status: "pending-rescore" }
  } catch (error) {
    console.error("[snapshot] kaydedilemedi", error instanceof Error ? error.message : error)
    return { status: "failed" }
  }
}
