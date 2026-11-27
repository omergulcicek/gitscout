import { seededRandom } from "@/features/scout/helpers/seeded-random"
import { POSITIONS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ListPlayer, Position, Rarity } from "@/features/scout/types/player.types"

export type DuelPreset = {
  position: Position
  rarity: Rarity
  left: ListPlayer
  right: ListPlayer
}

export type DuelPresetGroup = {
  position: Position
  /** Frontend, Backend ya da Full Stack: üst satırda gösterilir. */
  isMain: boolean
  presets: DuelPreset[]
}

/** En kalabalık alanlar: her birinden iki kapışma, üst satırda. */
const MAIN_POSITIONS: readonly Position[] = ["Frontend", "Backend", "Full Stack"]

/** Ana alanlar dışında önce bunlar denenir; kalan yer diğer alanlardan dolar. */
const PREFERRED_OTHERS: readonly Position[] = ["Mobile", "Data"]

/** Ana alanlar dışından kaç alan gösterilir; her birinden tek kapışma. */
const OTHER_COUNT = 3

const RARITY_ORDER: readonly Rarity[] = ["icon", "gold", "silver", "bronze"]

const TRY_ORDER: readonly Rarity[] = [
  "icon",
  "gold",
  "gold",
  "silver",
  "silver",
  "bronze",
  "bronze"
]

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    const current = result[index]
    const swap = result[other]
    if (current === undefined || swap === undefined) continue
    result[index] = swap
    result[other] = current
  }
  return result
}

/**
 * Ağırlığa göre bir öğe seçer. Ağırlık `1 + görüntülenme`: hiç bakılmamış biri de seçilebilir,
 * çok bakılan daha sık seçilir.
 */
function weightedPick<T>(
  items: T[],
  weight: (item: T) => number,
  random: () => number
): T | undefined {
  const total = items.reduce((sum, item) => sum + weight(item), 0)
  let threshold = random() * total
  for (const item of items) {
    threshold -= weight(item)
    if (threshold < 0) return item
  }
  return items.at(-1)
}

/**
 * Kapışma sayfasındaki hazır eşleşmeler, alana göre gruplu; toplam 9 kapışma. Frontend, Backend ve
 * Full Stack'ten ikişer, diğer alanlardan (önce Mobile ve Data) birer kapışma gelir. Önce İkon, sonra
 * Altın denenir; yetmezse yine Altın'dan başka bir çift, en son Gümüş ve Bronz. Bir kişi tek kartta yer
 * alır. Her eşleşmenin bir tarafı son günlerde profili çok görüntülenenlerden daha olası seçilir,
 * rakibi aynı gruptan rastgele gelir.
 * Aynı tohum her yerde aynı listeyi verir; böylece sunucu ve tarayıcı aynı eşleşmeleri çizer.
 */
export function duelPresetGroups(
  players: ListPlayer[],
  seed: number,
  profileViews: Readonly<Record<string, number>> = {}
): DuelPresetGroup[] {
  const random = seededRandom(seed)
  const used = new Set<string>()
  const pair = (position: Position, rarity: Rarity): DuelPreset | null => {
    const group = shuffle(
      players.filter(
        (player) =>
          player.position === position && player.rarity === rarity && !used.has(player.login)
      ),
      random
    )
    const left = weightedPick(
      group,
      (player) => 1 + (profileViews[player.login.toLowerCase()] ?? 0),
      random
    )
    const right = shuffle(
      group.filter((player) => player !== left),
      random
    )[0]
    if (!left || !right) return null
    used.add(left.login)
    used.add(right.login)
    return { position, rarity, left, right }
  }

  /**
   * Kart türlerini üstten alta dener. İkon'dan tek çift alınır (çoğu alanda az kişi var); Altın, Gümüş
   * ve Bronz'dan gerekirse ikinci bir çift de alınır. Böylece İkon'u olmayan alan iki Altın kapışmayla dolar.
   */
  const presetsFor = (position: Position, count: number): DuelPreset[] => {
    const presets: DuelPreset[] = []
    for (const rarity of TRY_ORDER) {
      if (presets.length === count) break
      const preset = pair(position, rarity)
      if (preset) presets.push(preset)
    }
    return presets
  }

  const groups: DuelPresetGroup[] = MAIN_POSITIONS.map((position) => ({
    position,
    isMain: true,
    presets: presetsFor(position, 2)
  }))

  // Diğer alanlar: önce Mobile ve Data, sonra en üst kart türü çifti olanlar.
  const bestRank = (position: Position) => {
    const rank = RARITY_ORDER.findIndex(
      (rarity) =>
        players.filter((player) => player.position === position && player.rarity === rarity)
          .length >= 2
    )
    return rank === -1 ? RARITY_ORDER.length : rank
  }
  const others = shuffle(
    POSITIONS.filter(
      (position) => !MAIN_POSITIONS.includes(position) && !PREFERRED_OTHERS.includes(position)
    ),
    random
  ).sort((a, b) => bestRank(a) - bestRank(b))
  for (const position of [...PREFERRED_OTHERS, ...others]) {
    if (groups.filter((group) => !group.isMain).length === OTHER_COUNT) break
    const presets = presetsFor(position, 1)
    if (presets.length > 0) groups.push({ position, isMain: false, presets })
  }

  return groups.filter((group) => group.presets.length > 0)
}

/**
 * The most-viewed pairs among the seeded presets: both sides' profile views from the last week added up.
 * Used for the duel page's "popular duels" row.
 */
export function popularPresets(
  players: ListPlayer[],
  seed: number,
  profileViews: Readonly<Record<string, number>>,
  count: number
): DuelPreset[] {
  const interest = (preset: DuelPreset) =>
    (profileViews[preset.left.login.toLowerCase()] ?? 0) +
    (profileViews[preset.right.login.toLowerCase()] ?? 0)
  return duelPresetGroups(players, seed, profileViews)
    .flatMap((group) => group.presets)
    .sort((a, b) => interest(b) - interest(a))
    .slice(0, count)
}
