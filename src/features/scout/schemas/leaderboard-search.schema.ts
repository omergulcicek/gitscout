import { z } from "zod"

export const LEADERBOARD_SORT_KEYS = [
  "ovr",
  "name",
  "position",
  "act",
  "imp",
  "com",
  "rep",
  "con",
  "exp"
] as const

export const POSITIONS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "DevOps",
  "Mobile",
  "Data",
  "Systems",
  "Game Dev"
] as const

export const RARITIES = ["icon", "gold", "silver", "bronze"] as const

/** URL'de görünen kısa adlar: `?pos=frontend,fullstack`. */
export const POSITION_SLUGS = {
  Frontend: "frontend",
  Backend: "backend",
  "Full Stack": "fullstack",
  DevOps: "devops",
  Mobile: "mobile",
  Data: "data",
  Systems: "systems",
  "Game Dev": "gamedev"
} as const satisfies Record<(typeof POSITIONS)[number], string>

/** Liderlik tablosu bir seferde bu kadar satır çizer; "Daha fazla göster" bir o kadar ekler. */
export const LEADERBOARD_PAGE_SIZE = 100

export const leaderboardSearchDefaults = {
  sort: "ovr",
  dir: "desc",
  limit: LEADERBOARD_PAGE_SIZE
} as const

/**
 * Liderlik tablosunun sıralaması ve filtreleri URL'de tutulur ki paylaşılan link aynı görünümü göstersin.
 * Filtreler virgülle ayrılmış düz metin; geçersiz parçalar okunurken atlanır.
 */
export const leaderboardSearchSchema = z.object({
  // Router `?q=123` gibi değerleri sayı olarak okur; metne çevrilir.
  q: z.coerce.string().optional().catch(undefined),
  pos: z.string().optional().catch(undefined),
  rarity: z.string().optional().catch(undefined),
  /** Tek ülke: `?country=tr`; ülkesi bilinmeyenler `?country=unknown`. */
  country: z.string().optional().catch(undefined),
  /** Yalnızca GitHub Stars programındakiler: `?program=star`. */
  program: z.string().optional().catch(undefined),
  /** Yalnızca onaylı hesaplar: `?verified=1`. Sayı tutulur ki router değeri tırnağa almasın. */
  verified: z.literal(1).optional().catch(undefined),
  sort: z
    .enum(LEADERBOARD_SORT_KEYS)
    .default(leaderboardSearchDefaults.sort)
    .catch(leaderboardSearchDefaults.sort),
  dir: z
    .enum(["asc", "desc"])
    .default(leaderboardSearchDefaults.dir)
    .catch(leaderboardSearchDefaults.dir),
  /** Gösterilen satır sayısı; URL'de durur ki geri dönünce aynı yer açılsın. */
  limit: z.coerce
    .number()
    .int()
    .min(LEADERBOARD_PAGE_SIZE)
    .max(100_000)
    .default(leaderboardSearchDefaults.limit)
    .catch(leaderboardSearchDefaults.limit)
})

export type LeaderboardSearch = z.infer<typeof leaderboardSearchSchema>

/** `?top=tr` or `?top=world`: which pool a "World · Türkiye" switch shows. Only the Turkish page reads it. */
const topViewSchema = z.enum(["tr", "world"]).optional().catch(undefined)

/**
 * Ana sayfa aynı tabloyu kullanır; ek olarak Türkçe sayfada ilk 10'un hangi liste olduğunu seçer.
 * Türkçede varsayılan Türkiye'dir (`?top=tr` ile aynı), `?top=world` genel listeyi gösterir. İngilizcede bu parametre yok sayılır.
 */
export const homeSearchSchema = leaderboardSearchSchema.extend({ top: topViewSchema })

/** The leaderboard page also picks the pool of its "today's best" strip the same way. */
export const leaderboardPageSearchSchema = leaderboardSearchSchema.extend({ top: topViewSchema })
