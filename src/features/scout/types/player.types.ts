import type { Team } from "@/constants/team.constants"

import type { CountryCode } from "@/features/scout/constants/player-country.constants"

/** Ham GitHub verisinden çıkarılmış, skorlamaya giren gerçekler. Formüller değişince bunlardan yeniden hesaplanır. */

export type CheckState = "SUCCESS" | "FAILURE" | "ERROR" | "PENDING" | "EXPECTED"

type LanguageSize = {
  name: string
  size: number
}

/** Kullanıcının sahibi olduğu, fork olmayan repo. DOC, POP ve dil dağılımı buradan hesaplanır. */
export type OwnedRepo = {
  name: string
  isArchived: boolean
  pushedAt: string
  stars: number
  forks: number
  hasDescription: boolean
  hasHomepage: boolean
  topicCount: number
  license: string | null
  readmeBytes: number
  languages: LanguageSize[]
}

/** Son 12 ayda üzerinde çalışılan repo (organizasyon repoları dahil). */
export type ActiveRepo = {
  nameWithOwner: string
  isOrg: boolean
  stars: number
  forks: number
  languages: LanguageSize[]
  /** Varsayılan dalda son bir yıldaki toplam commit ve bunların kullanıcıya ait olanları. */
  yearCommits: number
  userYearCommits: number
  /** Varsayılan dalın bütün geçmişindeki toplam commit ve kullanıcınınkiler. Eski kayıtlarda yok. */
  allCommits?: number
  userAllCommits?: number
  /** Yapay zekâ ajanı ve bot hesaplarının commit'leri; paydan düşülür. Eski kayıtlarda yok. */
  agentYearCommits?: number
  agentAllCommits?: number
  hasTests: boolean
  hasCi: boolean
  checkStates: CheckState[]
  userCommitsLastYear: number
}

export type CommitSample = {
  repo: string
  sha: string
  /** Birden çok ebeveynli commit; patch'i birleştirilen başkalarının commit'lerini gösterir. */
  isMerge: boolean
  message: string
  date: string
  changedFiles: number | null
}

type ContributionDay = {
  date: string
  count: number
}

type YearlyContribution = {
  year: number
  total: number
  /** O yılın PR review sayısı; eski kayıtlarda yok. */
  reviews?: number
}

/** En çok yıldızlı repolardan biri; yalnızca yıldız ve dil için hafif kayıt. */
export type StarredRepo = {
  name: string
  stars: number
  forks: number
  language: string | null
}

/** Son bir yılda herkese açık bir repoya atılan commit sayısı ve reponun yıldızı. */
type RepoCommits = {
  repo: string
  commits: number
  stars: number
}

/** Kullanıcının maintainer olduğu organizasyonda birleştirilen PR sayısı. */
export type OrgPrCount = {
  org: string
  prs: number
}

/** Son bir yılın katkı toplamları; private katkılar yalnızca sayı olarak gelir. */
type LastYearTotals = {
  commits: number
  prs: number
  reviews: number
  issues: number
  restricted: number
}

export type PlayerFacts = {
  login: string
  name: string | null
  avatarUrl: string
  bio: string | null
  company: string | null
  /** GitHub profilindeki serbest metin konum; yenilenmemiş kayıtlarda yok. */
  location?: string | null
  followers: number
  createdAt: string
  topOrg: string | null
  mergedExternalPrs: number
  /** Son commit'lerden çıkarılan yerel saat farkı (dakika); saat bazlı rozetler bunu kullanır. */
  utcOffsetMinutes?: number | null
  lastYear: LastYearTotals
  ownedRepos: OwnedRepo[]
  activeRepos: ActiveRepo[]
  commits: CommitSample[]
  calendar: ContributionDay[]
  yearly: YearlyContribution[]
  /** Aşağıdaki üç alan sonradan eklendi; yenilenmemiş kayıtlarda yoksa eski hesap kullanılır. */
  starredRepos?: StarredRepo[]
  repoCommits?: RepoCommits[]
  ownOrgPrs?: OrgPrCount[]
}

export type StoredPlayer = {
  login: string
  fetchedAt: string
  /** Saat bazlı rozetler için IANA saat dilimi; boşsa varsayılan kullanılır. */
  timezone?: string
  facts: PlayerFacts
}

/* ---------- Skorlanmış çıktı ---------- */

export type StatKey = "act" | "imp" | "com" | "rep" | "con" | "exp"

/** Puanın parçaları; adları arayüzde dile göre yazılır. */
export type StatPartId =
  | "act_contributions"
  | "imp_stars"
  | "imp_forks"
  | "com_followers"
  | "rep_prs"
  | "rep_reviews"
  | "con_days"
  | "con_streak"
  | "con_years"
  | "exp_lifetime"
  | "exp_years"

export type StatPart = {
  id: StatPartId
  points: number
  max: number
}

/** Tooltip'teki tek cümlelik özetin sayıları; cümle arayüzde dile göre kurulur. */
export type StatSummary =
  | { key: "act"; contributions: number }
  | { key: "imp"; stars: number; forks: number }
  | { key: "com"; followers: number }
  | { key: "rep"; prs: number; reviews: number }
  | { key: "con"; days: number; streak: number }
  | { key: "exp"; years: number; contributions: number }

export type Stat = {
  key: StatKey
  /** Kartta gösterilen puan (eğriden geçmiş). */
  value: number
  /** Formülden çıkan ham puan; genel puan bunun üzerinden hesaplanır. */
  raw: number
  summary: StatSummary
  parts: StatPart[]
}

export type Rarity = "bronze" | "silver" | "gold" | "icon"

export type Position =
  "Frontend" | "Backend" | "Full Stack" | "DevOps" | "Mobile" | "Data" | "Systems" | "Game Dev"

export type BadgeId =
  | "night-owl"
  | "early-bird"
  | "weekend-warrior"
  | "marathon"
  | "green-tick"
  | "polyglot"
  | "conventional-disciple"
  | "star-collector"
  | "oss-ambassador"
  | "test-obsessed"
  | "commit-machine"
  | "pr-machine"
  | "code-reviewer"
  | "community-leader"
  | "team-player"
  | "documenter"
  | "veteran"
  | "regular"

/** Rozet açıklamalarındaki sayılar; yüzdeler 0-100 arası tam sayı. */
type BadgeValues = {
  "night-owl": { pct: number }
  "early-bird": { pct: number }
  "weekend-warrior": { pct: number }
  marathon: { days: number }
  "green-tick": { total: number; pct: number }
  polyglot: { count: number; languages: string }
  "conventional-disciple": { pct: number }
  "star-collector": { stars: number }
  "oss-ambassador": { prs: number }
  "test-obsessed": { active: number; tested: number }
  "commit-machine": { commits: number }
  "pr-machine": { prs: number }
  "code-reviewer": { reviews: number }
  "community-leader": { followers: number }
  "team-player": { repos: number; min: number }
  documenter: { total: number; documented: number }
  veteran: { years: number }
  regular: { weeks: number }
}

export type Badge = { [K in BadgeId]: { id: K; values: BadgeValues[K] } }[BadgeId]

/** Unvan: en güçlü stat, nadirlik ve o kombinasyondaki seçenek sırası. */
export type TitleRef = { stat: StatKey; rarity: Rarity; variant: number }

/** Scout notunun parçaları; cümleler arayüzde dile göre, statların sayılarıyla kurulur. */
export type Archetype = {
  rarity: Rarity
  strengths: StatKey[]
  /** Tavsiye verilecek statlar, en zayıftan başlayarak. Eski özetlerde yerine `weakness` vardır. */
  growth?: StatKey[]
  /** Eski özetlerin tek gelişim alanı; yeni özetler `growth` yazar. */
  weakness?: StatKey | null
}

export type RoleGroup = Exclude<Position, "Full Stack">

/** Mevkinin nasıl hesaplandığını detay sayfasında açıklamak için. Paylar yıldız ağırlıklıdır. */
export type PositionBreakdown = {
  repoCount: number
  /** Python'un Data sayılıp sayılmadığı (notebook/CUDA içeren repolar nedeniyle). */
  pythonAsData: boolean
  roles: { group: RoleGroup; share: number }[]
  languages: { name: string; group: RoleGroup | null; share: number; repos: number }[]
}

/** Detay sayfasındaki "öne çıkan repolar" listesi; yalnızca public repolar. */
export type TopRepo = {
  fullName: string
  stars: number
  forks: number
  language: string | null
  /** Organizasyon reposu: oyuncunun sahibi olmadığı ama son bir yılda katkı verdiği repo. */
  isOrg: boolean
}

/** Detay sayfasındaki "Son 1 yıl" bloğu için ham sayılar. */
/** Kariyer boyu sayılar; kapışmadaki "Rakamlar" tablosu için. */
type CareerTotals = {
  followers: number
  stars: number
  contributions: number
}

type YearSummary = {
  commits: number
  prs: number
  reviews: number
  issues: number
  activeDays: number
  longestStreak: number
  /** Son 52 haftanın haftalık katkı toplamları, eskiden yeniye. Eski özetlerde yoktur. */
  weeklyTotals?: number[]
}

/** Oyuncunun kayıtlı oyuncular arasındaki yeri; yalnızca detay sayfası için hesaplanır. */
export type PlayerRanking = {
  overall: number
  total: number
  inPosition: number
  positionTotal: number
}

export type ScoredPlayer = {
  login: string
  name: string
  avatarUrl: string
  /** Şirket ya da organizasyon; ikisi de yoksa null (serbest oyuncu). */
  club: string | null
  /** GitHub konumundan çıkarılan ülke; bulunamazsa yok. Elle atanmış ülke bunun önüne geçer. */
  country?: CountryCode
  position: Position
  positionBreakdown: PositionBreakdown
  topRepos: TopRepo[]
  ovr: number
  /** Yuvarlanmamış genel puan (iki ondalık); arayüzde gösterilmez, sıralamada eşitliği bozar. */
  ovrExact: number
  rarity: Rarity
  title: TitleRef
  archetype: Archetype
  stats: Record<StatKey, Stat>
  year: YearSummary
  career: CareerTotals
  badges: Badge[]
  fetchedAt: string
  /** Hesabını GitHub ile sahiplenmiş ve onay koşullarını geçmiş. Okuma anında hesap tablosundan eklenir. */
  verified?: boolean
  /** Onaylı sahibinin kendi seçtiği ülke; her kaynağın önüne geçer. Okuma anında hesap tablosundan eklenir. */
  claimedCountry?: CountryCode
  /** Onaylı sahibinin yerel saatine göre bugün doğum günü; yalnızca profil okumasında eklenir. */
  birthdayToday?: true
  /** Onaylı sahibi cinsiyetini kadın seçmiş ve bugün 8 Mart; yalnızca profil okumasında eklenir. */
  womensDayToday?: true
  /**
   * Onaylı sahibinin profilde varsayılan seçtiği kalıcı kart yüzü: takım kartı (takımın kimliğiyle) ya da
   * GitHub Star kartı. Yalnızca profil okumasında ve koşullar hâlâ geçerliyse eklenir.
   */
  cardFace?: Team | "github-star"
}

/** Listelerde bir statın yalnızca kartta görünen puanı; ham puan ve parçalar detay sayfasında. */
export type ListStat = Pick<Stat, "key" | "value">

/**
 * Liste ekranlarının (ana sayfa, liderlik, kapışma) ihtiyacı kadar oyuncu verisi. Rol dağılımı,
 * öne çıkan repolar, arşetip ve stat parçaları yalnızca detay sayfasında kullanılır; listeyi
 * ~4 kat hafifletmek için taşınmaz. Tam `ScoredPlayer` bu tipe her yerde uyar.
 */
export type ListPlayer = Omit<
  ScoredPlayer,
  "positionBreakdown" | "topRepos" | "archetype" | "stats"
> & { stats: Record<StatKey, ListStat> }

/** A list player with their rank inside the filtered pool (by OVR); search and column sorting don't change it. */
export type RankedPlayer = ListPlayer & { rank: number }

/** One page of the leaderboard, already filtered, searched, sorted and sliced on the server. */
export type LeaderboardSlice = {
  players: RankedPlayer[]
  /** Players matching the filters and the search, before slicing. */
  matched: number
  /** Everyone on the leaderboard, ignoring filters. */
  total: number
}

/** A card in the home page's "recently added" strip. */
export type RecentEntry = { player: ListPlayer; addedAt: string }

/** Everything the home page renders, resolved on the server so the full list never reaches the page. */
export type HomeData = {
  /** Top players overall and in Türkiye, each ranked inside its own pool. */
  top: { world: RankedPlayer[]; tr: RankedPlayer[] }
  /** Pool sizes for the "full table (N)" link. */
  totals: { world: number; tr: number }
  examples: ListPlayer[]
  /** The hour's featured card first, then the next ones "Another card" cycles through. */
  featured: ListPlayer[]
  recent: RecentEntry[]
  lastDayCount: number
  /** When the data was built; relative times are written against it so server and browser agree. */
  generatedAt: string
}

/** Filter options and summary counts for the leaderboard, computed from the whole list. */
export type LeaderboardFacets = {
  total: number
  rarityCounts: Record<Rarity, number>
  positions: Position[]
  hasStars: boolean
  hasVerified: boolean
  countries: { country: CountryCode; count: number }[]
  unknownCountry: number
}

export type BenchmarkKey = "commits" | "activeDays" | "longestStreak" | "stars" | "followers"

/** Bir ölçüde oyuncunun diğer geliştiricilere göre yeri. */
export type Benchmark = {
  key: BenchmarkKey
  value: number
  /** Oyuncunun önünde olduğu diğer geliştiricilerin payı (0-1); kıyaslanacak kimse yoksa null. */
  aheadShare: number | null
}

export type PlayerDetail = ScoredPlayer & { ranking: PlayerRanking; benchmarks: Benchmark[] }
