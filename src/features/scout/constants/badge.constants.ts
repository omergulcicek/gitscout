import type { BadgeCardSize, BadgeSize } from "@/features/scout/schemas/badge.schema"

/** Ayarlardaki seçimin sırası: küçükten büyüğe. */
export const BADGE_SIZES = ["mini", "medium", "full"] as const satisfies readonly BadgeSize[]

/**
 * Kart rozetlerinin çizim boyutları (CSS px). PNG iki kat çözünürlükte üretilir, README'deki HTML
 * `width` bu genişliğe küçültür. Tam kart, link önizlemelerindeki oyuncu kartıyla ve sitedeki kartla
 * aynı ölçüde: 320×480.
 */
export const BADGE_CARD_SIZES = {
  medium: { width: 220, height: 262 },
  full: { width: 320, height: 480 }
} as const satisfies Record<BadgeCardSize, { width: number; height: number }>

/**
 * README kartlarının köşesindeki imza. GitHub görselleri kendi proxy'sinden sunduğu için adres
 * Gitscout'u göstermez; kartı görenin siteyi bulabileceği tek ipucu budur. İndirilen kart da aynısını yazar.
 */
export const BADGE_SIGNATURE = "gitscout.io"
