import { localizedUrl } from "@/helpers/localized-url"

import {
  archetypeNote,
  badgeName,
  rarityLabel,
  titleText
} from "@/features/scout/helpers/player-text"
import type { ShareLocale, SharePlatform } from "@/features/scout/schemas/share.schema"
import type { PlayerDetail } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** LinkedIn metninde sayılan en fazla rozet; fazlası listeyi uzatır. */
const SHARED_BADGES = 3

/**
 * Kartı sosyal medyada paylaşmak için hazır metin. LinkedIn sürümü ikonlu maddelerle kartın
 * özetini, scout notunun en güçlü maddesini ve rozetleri taşır; X sürümü 280 karaktere sığar
 * (link X'te 23 karakter sayılır).
 */
export function shareText(player: PlayerDetail, platform: SharePlatform, locale: ShareLocale) {
  const options = { locale }
  const format = new Intl.NumberFormat(locale)
  const url = localizedUrl(`/u/${player.login}`, locale)
  const ovr = player.ovr
  const role = player.position
  const title = titleText(player.title, locale)
  const rank = format.format(player.ranking.overall)
  const total = format.format(player.ranking.total)

  if (platform === "x") return m.share_x_text({ ovr, role, title, rank, total, url }, options)

  const [strength] = archetypeNote(player.archetype, player.stats, locale).strengths
  const badges = player.badges.slice(0, SHARED_BADGES).map((badge) => badgeName(badge.id, locale))
  // Güçlü yanı ya da rozeti olmayan kartta o madde hiç yazılmaz.
  const lines = [
    m.share_line_ovr({ ovr, rarity: rarityLabel(player.rarity, locale) }, options),
    m.share_line_role({ role }, options),
    m.share_line_title({ title }, options),
    m.share_line_rank({ rank, total }, options),
    strength ? m.share_line_note({ note: strength }, options) : null,
    badges.length > 0 ? m.share_line_badges({ badges: badges.join(", ") }, options) : null
  ].filter((line) => line !== null)

  return [
    m.share_intro({}, options),
    lines.join("\n"),
    `${m.share_outro({}, options)}\n${url}`,
    m.share_tags({}, options)
  ].join("\n\n")
}
