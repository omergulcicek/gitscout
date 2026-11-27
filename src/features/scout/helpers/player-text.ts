import type {
  Archetype,
  Badge,
  BadgeId,
  Rarity,
  Stat,
  StatKey,
  StatPartId,
  TitleRef
} from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

/** Dili ayrıca seçilebilen mesaj; paylaşım metni sayfa dilinden bağımsız kurulur. */
type LocalizedMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string

/**
 * Skor çıktısı dilden bağımsızdır (anahtar + sayı); cümleler burada, okunduğu anda dile göre kurulur.
 * Mesajlar fonksiyon içinde çağrılır ki her istek kendi dilini kullansın.
 */

export function number(value: number, locale: Locale = getLocale()): string {
  return new Intl.NumberFormat(locale).format(Math.round(value))
}

/** 0-100 arası tam sayı: Türkçede "%45", İngilizcede "45%". */
export function percent(value: number): string {
  return new Intl.NumberFormat(getLocale(), { style: "percent" }).format(value / 100)
}

const STAT_LABELS = {
  act: m.stat_act,
  imp: m.stat_imp,
  com: m.stat_com,
  rep: m.stat_rep,
  con: m.stat_con,
  exp: m.stat_exp
} as const satisfies Record<StatKey, () => string>

export function statLabel(key: StatKey): string {
  return STAT_LABELS[key]()
}

/** Kartta ve tabloda üç harfli kısaltma: ACT / AKT gibi. */
const STAT_SHORT = {
  act: m.stat_short_act,
  imp: m.stat_short_imp,
  com: m.stat_short_com,
  rep: m.stat_short_rep,
  con: m.stat_short_con,
  exp: m.stat_short_exp
} as const satisfies Record<StatKey, LocalizedMessage>

export function statShort(key: StatKey, locale?: Locale): string {
  return STAT_SHORT[key]({}, { locale })
}

export function statSummary(summary: Stat["summary"]): string {
  switch (summary.key) {
    case "act":
      return m.summary_act({ contributions: number(summary.contributions) })
    case "imp":
      return m.summary_imp({ stars: number(summary.stars), forks: number(summary.forks) })
    case "com":
      return m.summary_com({ followers: number(summary.followers) })
    case "rep":
      return m.summary_rep({ prs: number(summary.prs), reviews: number(summary.reviews) })
    case "con":
      return m.summary_con({ days: number(summary.days), streak: number(summary.streak) })
    case "exp":
      return m.summary_exp({
        years: number(summary.years),
        contributions: number(summary.contributions)
      })
  }
}

const PART_LABELS = {
  act_contributions: m.part_act_contributions,
  imp_stars: m.part_imp_stars,
  imp_forks: m.part_imp_forks,
  com_followers: m.part_com_followers,
  rep_prs: m.part_rep_prs,
  rep_reviews: m.part_rep_reviews,
  con_days: m.part_con_days,
  con_streak: m.part_con_streak,
  con_years: m.part_con_years,
  exp_lifetime: m.part_exp_lifetime,
  exp_years: m.part_exp_years
} as const satisfies Record<StatPartId, () => string>

export function partLabel(id: StatPartId): string {
  return PART_LABELS[id]()
}

const RARITY_LABELS = {
  icon: m.rarity_icon,
  gold: m.rarity_gold,
  silver: m.rarity_silver,
  bronze: m.rarity_bronze
} as const satisfies Record<Rarity, LocalizedMessage>

export function rarityLabel(rarity: Rarity, locale?: Locale): string {
  return RARITY_LABELS[rarity]({}, { locale })
}

export function clubLabel(club: string | null): string {
  return club ?? m.club_free_agent()
}

const BADGE_NAMES = {
  "night-owl": m.badge_night_owl,
  "early-bird": m.badge_early_bird,
  "weekend-warrior": m.badge_weekend_warrior,
  marathon: m.badge_marathon,
  "green-tick": m.badge_green_tick,
  polyglot: m.badge_polyglot,
  "conventional-disciple": m.badge_conventional_disciple,
  "star-collector": m.badge_star_collector,
  "oss-ambassador": m.badge_oss_ambassador,
  "test-obsessed": m.badge_test_obsessed,
  "commit-machine": m.badge_commit_machine,
  "pr-machine": m.badge_pr_machine,
  "code-reviewer": m.badge_code_reviewer,
  "community-leader": m.badge_community_leader,
  "team-player": m.badge_team_player,
  documenter: m.badge_documenter,
  veteran: m.badge_veteran,
  regular: m.badge_regular
} as const satisfies Record<BadgeId, LocalizedMessage>

export function badgeName(id: BadgeId, locale?: Locale): string {
  return BADGE_NAMES[id]({}, { locale })
}

export function badgeDetail(badge: Badge): string {
  switch (badge.id) {
    case "night-owl": {
      const v = badge.values
      return m.badge_night_owl_detail({ pct: percent(v.pct) })
    }
    case "early-bird": {
      const v = badge.values
      return m.badge_early_bird_detail({ pct: percent(v.pct) })
    }
    case "weekend-warrior": {
      const v = badge.values
      return m.badge_weekend_warrior_detail({ pct: percent(v.pct) })
    }
    case "marathon": {
      const v = badge.values
      return m.badge_marathon_detail({ days: number(v.days) })
    }
    case "green-tick": {
      const v = badge.values
      return m.badge_green_tick_detail({ total: number(v.total), pct: percent(v.pct) })
    }
    case "polyglot": {
      const v = badge.values
      return m.badge_polyglot_detail({ count: number(v.count), languages: v.languages })
    }
    case "conventional-disciple": {
      const v = badge.values
      return m.badge_conventional_disciple_detail({ pct: percent(v.pct) })
    }
    case "star-collector": {
      const v = badge.values
      return m.badge_star_collector_detail({ stars: number(v.stars) })
    }
    case "oss-ambassador": {
      const v = badge.values
      return m.badge_oss_ambassador_detail({ prs: number(v.prs) })
    }
    case "test-obsessed": {
      const v = badge.values
      return m.badge_test_obsessed_detail({ active: number(v.active), tested: number(v.tested) })
    }
    case "commit-machine": {
      const v = badge.values
      return m.badge_commit_machine_detail({ commits: number(v.commits) })
    }
    case "pr-machine": {
      const v = badge.values
      return m.badge_pr_machine_detail({ prs: number(v.prs) })
    }
    case "code-reviewer": {
      const v = badge.values
      return m.badge_code_reviewer_detail({ reviews: number(v.reviews) })
    }
    case "community-leader": {
      const v = badge.values
      return m.badge_community_leader_detail({ followers: number(v.followers) })
    }
    case "team-player": {
      const v = badge.values
      return m.badge_team_player_detail({ repos: number(v.repos), min: number(v.min) })
    }
    case "documenter": {
      const v = badge.values
      return m.badge_documenter_detail({ total: number(v.total), documented: number(v.documented) })
    }
    case "veteran": {
      const v = badge.values
      return m.badge_veteran_detail({ years: number(v.years) })
    }
    case "regular": {
      const v = badge.values
      return m.badge_regular_detail({ weeks: number(v.weeks) })
    }
  }
}

const TITLES = {
  act: {
    icon: [m.title_act_icon_0, m.title_act_icon_1, m.title_act_icon_2],
    gold: [m.title_act_gold_0, m.title_act_gold_1, m.title_act_gold_2],
    silver: [m.title_act_silver_0, m.title_act_silver_1, m.title_act_silver_2],
    bronze: [m.title_act_bronze_0, m.title_act_bronze_1, m.title_act_bronze_2]
  },
  imp: {
    icon: [m.title_imp_icon_0, m.title_imp_icon_1, m.title_imp_icon_2],
    gold: [m.title_imp_gold_0, m.title_imp_gold_1, m.title_imp_gold_2],
    silver: [m.title_imp_silver_0, m.title_imp_silver_1, m.title_imp_silver_2],
    bronze: [m.title_imp_bronze_0, m.title_imp_bronze_1, m.title_imp_bronze_2]
  },
  com: {
    icon: [m.title_com_icon_0, m.title_com_icon_1, m.title_com_icon_2],
    gold: [m.title_com_gold_0, m.title_com_gold_1, m.title_com_gold_2],
    silver: [m.title_com_silver_0, m.title_com_silver_1, m.title_com_silver_2],
    bronze: [m.title_com_bronze_0, m.title_com_bronze_1, m.title_com_bronze_2]
  },
  rep: {
    icon: [m.title_rep_icon_0, m.title_rep_icon_1, m.title_rep_icon_2],
    gold: [m.title_rep_gold_0, m.title_rep_gold_1, m.title_rep_gold_2],
    silver: [m.title_rep_silver_0, m.title_rep_silver_1, m.title_rep_silver_2],
    bronze: [m.title_rep_bronze_0, m.title_rep_bronze_1, m.title_rep_bronze_2]
  },
  con: {
    icon: [m.title_con_icon_0, m.title_con_icon_1, m.title_con_icon_2],
    gold: [m.title_con_gold_0, m.title_con_gold_1, m.title_con_gold_2],
    silver: [m.title_con_silver_0, m.title_con_silver_1, m.title_con_silver_2],
    bronze: [m.title_con_bronze_0, m.title_con_bronze_1, m.title_con_bronze_2]
  },
  exp: {
    icon: [m.title_exp_icon_0, m.title_exp_icon_1, m.title_exp_icon_2],
    gold: [m.title_exp_gold_0, m.title_exp_gold_1, m.title_exp_gold_2],
    silver: [m.title_exp_silver_0, m.title_exp_silver_1, m.title_exp_silver_2],
    bronze: [m.title_exp_bronze_0, m.title_exp_bronze_1, m.title_exp_bronze_2]
  }
} as const satisfies Record<StatKey, Record<Rarity, readonly LocalizedMessage[]>>

export function titleText(title: TitleRef, locale?: Locale): string {
  const pool: readonly LocalizedMessage[] = TITLES[title.stat][title.rarity]
  return (pool[title.variant] ?? pool[0] ?? m.title_act_bronze_0)({}, { locale })
}

/** Büyük sayılar notta kısa yazılır: "269.131" yerine "269 B". */
function compact(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(Math.round(value))
}

/** Güçlü yan cümlesi; stat özetindeki sayılarla somutlaşır. */
function strengthText(summary: Stat["summary"], locale: Locale): string {
  const options = { locale }
  switch (summary.key) {
    case "act":
      return m.archetype_strength_act(
        { contributions: compact(summary.contributions, locale) },
        options
      )
    case "imp":
      return m.archetype_strength_imp({ stars: compact(summary.stars, locale) }, options)
    case "com":
      return m.archetype_strength_com({ followers: compact(summary.followers, locale) }, options)
    case "rep":
      return m.archetype_strength_rep({ prs: compact(summary.prs, locale) }, options)
    case "con":
      return m.archetype_strength_con(
        { days: number(summary.days, locale), streak: number(summary.streak, locale) },
        options
      )
    case "exp":
      return m.archetype_strength_exp(
        {
          years: number(summary.years, locale),
          contributions: compact(summary.contributions, locale)
        },
        options
      )
  }
}

const ARCHETYPE_GROWTH = {
  act: m.archetype_growth_act,
  imp: m.archetype_growth_imp,
  com: m.archetype_growth_com,
  rep: m.archetype_growth_rep,
  con: m.archetype_growth_con,
  exp: m.archetype_growth_exp
} as const satisfies Record<StatKey, LocalizedMessage>

/** Scout notu: güçlü yanlar sayılarıyla, ardından tavsiyeler; toplam üç madde. */
export function archetypeNote(
  archetype: Archetype,
  stats: Record<StatKey, Stat>,
  locale: Locale = getLocale()
): { strengths: string[]; growth: string[] } {
  // Yeniden puanlanmamış eski özetlerde tek bir `weakness` alanı durur.
  const growth = archetype.growth ?? (archetype.weakness ? [archetype.weakness] : [])
  return {
    strengths: archetype.strengths.map((key) => strengthText(stats[key].summary, locale)),
    growth: growth.map((key) => ARCHETYPE_GROWTH[key]({}, { locale }))
  }
}
