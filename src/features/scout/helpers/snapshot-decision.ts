type LastSnapshot = { takenAt: Date; scoreVersion: number }

/**
 * - `due`: kayıt alınmalı.
 * - `not-due`: son kayıt güncel formülle alınmış ve süresi dolmamış.
 * - `pending-rescore`: kayıt alınmalı ama bazı oyuncuların puanı henüz güncel formülle hesaplanmadı;
 *   karışık sürümlü bir tur yazılmasın diye beklenir.
 */
export type SnapshotDecision = "due" | "not-due" | "pending-rescore"

type SnapshotState = {
  last: LastSnapshot | null
  /** Puanı güncel formülden farklı bir sürümle yazılmış oyuncu sayısı. */
  unsettled: number
  now: Date
  scoreVersion: number
  intervalDays: number
}

/** Puan ve sıra geçmişine yeni bir tur yazılıp yazılmayacağı. Tablo boşsa ilk tur hemen alınır. */
export function snapshotDecision({
  last,
  unsettled,
  now,
  scoreVersion,
  intervalDays
}: SnapshotState): SnapshotDecision {
  const intervalMs = intervalDays * 24 * 60 * 60_000
  const due =
    last === null ||
    last.scoreVersion !== scoreVersion ||
    now.getTime() - last.takenAt.getTime() >= intervalMs
  if (!due) return "not-due"
  return unsettled > 0 ? "pending-rescore" : "due"
}
