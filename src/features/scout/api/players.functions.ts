import { notFound } from "@tanstack/react-router"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { getRequestIP } from "@tanstack/react-start/server"
import { z } from "zod"

import { getCurrentViewer } from "@/lib/auth.functions"
import { ipBucket, UNKNOWN_IP_BUCKET } from "@/helpers/ip-bucket"

import { fetchPlayerFacts } from "@/features/scout/api/fetch-player-facts.api"
import { GithubError } from "@/features/scout/api/get-github-data.api"
import { createLookupGuard } from "@/features/scout/api/lookup-guard"
import type { LookupFailure } from "@/features/scout/api/lookup-guard"
import {
  countRecentPlayers,
  getDreamTeamLogins,
  getLatestAdditions,
  getListPlayers,
  getRecentLogins,
  getRecentProfileViews,
  getScoredPlayer,
  insertPlayer,
  takeLookup,
  updateAccountBirthDate,
  updateAccountCountry,
  updateAccountProfileDetails
} from "@/features/scout/api/player-store"
import { EXAMPLE_LOGINS } from "@/features/scout/constants/example-players.constants"
import { COUNTRIES } from "@/features/scout/constants/player-country.constants"
import { SPECIAL_CARDS_SAMPLE_LOGIN } from "@/features/scout/constants/profile.constants"
import {
  NEW_LOOKUPS_PER_IP,
  NEW_PLAYERS_PER_HOUR,
  NOT_FOUND_TTL_MS
} from "@/features/scout/constants/scoring.constants"
import { computeBenchmarks } from "@/features/scout/helpers/benchmarks"
import { ageOn } from "@/features/scout/helpers/birthday"
import { dailyBest } from "@/features/scout/helpers/daily-best"
import { popularPresets } from "@/features/scout/helpers/duel-presets"
import type { DuelPreset } from "@/features/scout/helpers/duel-presets"
import { featuredOrder } from "@/features/scout/helpers/featured-players"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { leaderboardFacets, queryLeaderboard } from "@/features/scout/helpers/leaderboard-query"
import { countPlayerCountries, playerCountry } from "@/features/scout/helpers/player-country"
import { computeRanking } from "@/features/scout/helpers/score-player"
import { matchesPlayer } from "@/features/scout/helpers/search-text"
import { similarPlayers } from "@/features/scout/helpers/similar-players"
import { leaderboardSearchSchema } from "@/features/scout/schemas/leaderboard-search.schema"
import { addPlayerSchema, usernameSchema } from "@/features/scout/schemas/player.schema"
import { profileDetailsSchema } from "@/features/scout/schemas/profile.schema"
import type { AddPlayerEvent, ScoutingStage } from "@/features/scout/types/add-player.types"
import type {
  HomeData,
  LeaderboardFacets,
  LeaderboardSlice,
  ListPlayer,
  PlayerDetail,
  ScoredPlayer
} from "@/features/scout/types/player.types"
import { locales } from "@/paraglide/runtime.js"

type LatestAddition = { login: string; addedAt: string }

const HOUR_MS = 60 * 60_000
/** Şeridin 8 kartı, listede karşılığı bulunmayan (silinmiş, henüz listeye girmemiş) kayıtlar düşse de dolsun diye fazladan çekilir. */
const LATEST_LIMIT = 12

/**
 * Aynı sunucu örneği bu süre içinde gelen istekleri veritabanına gitmeden karşılar. Veri haftada bir yenilenir;
 * yeni eklenen kart, ekleyen kişinin örneğinde hemen, diğer örneklerde en geç bu süre sonra listeye girer.
 */
const LIST_CACHE_MS = 5 * 60_000

/** Yeniden puanlanmayı bekleyen özet varken önbellek kısa tutulur ki her istek işi biraz daha ilerletsin. */
const PENDING_LIST_CACHE_MS = 30_000

type ListSnapshot = {
  at: number
  /** Bu süre dolunca liste yeniden yüklenir. */
  ttl: number
  players: ListPlayer[]
  recentLogins: string[]
  latest: LatestAddition[]
  lastDayCount: number
  profileViews: Record<string, number>
}

let listCache: ListSnapshot | null = null
let listLoading: Promise<ListSnapshot> | null = null

/**
 * Liste sorgusu ~400 KB taşır ve uzak bölgedeki veritabanından birkaç saniye sürebilir. Aynı anda gelen
 * istekler (SSR, istemci, yeni sekme) aynı yüklemeyi bekler; sorgular da sırayla gider. Transaction
 * pooler'da aynı bağlantıda üst üste binen sorgular takılıp sunucuyu kilitliyordu.
 */
function loadList(): Promise<ListSnapshot> {
  listLoading ??= (async () => {
    // Son eklenenler listeden önce okunur: arada eklenen kişi şeritte olup listede eksik kalmasın.
    const latest = await getLatestAdditions(LATEST_LIMIT)
    const { players, pending } = await getListPlayers()
    const recentLogins = await getRecentLogins()
    const lastDayCount = await countRecentPlayers(24)
    const profileViews = await getRecentProfileViews(7)
    const ttl = pending > 0 ? PENDING_LIST_CACHE_MS : LIST_CACHE_MS
    listCache = { at: Date.now(), ttl, players, recentLogins, latest, lastDayCount, profileViews }
    return listCache
  })().finally(() => {
    listLoading = null
  })
  return listLoading
}

async function cachedList(): Promise<ListSnapshot> {
  if (listCache && Date.now() - listCache.at < listCache.ttl) return listCache
  return loadList()
}

async function cachedPlayers(): Promise<ListPlayer[]> {
  return (await cachedList()).players
}

/**
 * Önbellekteki listenin ilk `limit` oyuncusu ve verinin anı; herkese açık `/api/top.json` için.
 * `createServerOnlyFn` şart: düz bir fonksiyon, rota dosyası üzerinden veritabanı istemcisini tarayıcı
 * paketine taşıyor ve sayfa açılışta çöküyordu.
 */
export const getTopPlayers = createServerOnlyFn(
  async (limit: number): Promise<{ generatedAt: string; players: ListPlayer[] }> => {
    const { at, players } = await cachedList()
    return { generatedAt: new Date(at).toISOString(), players: players.slice(0, limit) }
  }
)

/**
 * README rozeti için oyuncunun genel sıradaki yeri; kayıtlı değilse `null`. Önbellekteki listeden
 * okunur, böylece GitHub'ın görsel proxy'sinden gelen istekler veritabanına yük bindirmez.
 */
export const getBadgePlayer = createServerOnlyFn(
  async (login: string): Promise<{ rank: number; player: ListPlayer } | null> => {
    const key = login.toLowerCase()
    const players = await cachedPlayers()
    const index = players.findIndex((player) => player.login.toLowerCase() === key)
    const player = players[index]
    return player ? { rank: index + 1, player } : null
  }
)

export const getPlayer = createServerFn({ method: "GET" })
  // Geçersiz kullanıcı adı doğrulama hatası (500) değil, "bulunamadı" (404) sayılır.
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data }): Promise<PlayerDetail> => {
    const username = usernameSchema.safeParse(data.username)
    if (!username.success) throw notFound()
    const [player, dreamTeamLogins] = await Promise.all([
      getScoredPlayer(username.data),
      getDreamTeamLogins(username.data)
    ])
    if (!player) throw notFound()
    const all = await cachedPlayers()
    const byLogin = new Map(all.map((entry) => [entry.login.toLowerCase(), entry]))
    return {
      ...player,
      ranking: computeRanking(player, all),
      benchmarks: computeBenchmarks(player, all),
      dreamTeam: dreamTeamLogins.flatMap((login) => byLogin.get(login.toLowerCase()) ?? []),
      similar: similarPlayers(player, all)
    }
  })

/** Rows in each home page top list. */
const HOME_TOP_LIMIT = 10
/** Cards in the "recently added" strip; the wide grid fits eight in one row. */
const HOME_RECENT_LIMIT = 8
/** Featured cards sent with the page; "Another card" cycles through them. */
const HOME_FEATURED_LIMIT = 12
/** Flags in the hero's proof line. */
const HOME_COUNTRY_FLAGS = 5

const ranked = (players: readonly ListPlayer[]) =>
  players.slice(0, HOME_TOP_LIMIT).map((player, index) => ({ ...player, rank: index + 1 }))

/** The home page's data: a few dozen players instead of the whole list. */
export const getHome = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const { at, players, recentLogins, latest, lastDayCount } = await cachedList()
  const byLogin = new Map(players.map((player) => [player.login.toLowerCase(), player]))
  const turkish = players.filter((player) => playerCountry(player) === "TR")
  const seed = Math.floor(Date.now() / HOUR_MS)
  const recentSet = new Set(recentLogins)
  const { countries } = countPlayerCountries(players)
  return {
    top: { world: ranked(players), tr: ranked(turkish) },
    totals: { world: players.length, tr: turkish.length },
    examples: EXAMPLE_LOGINS.flatMap((login) => byLogin.get(login) ?? []),
    featured: {
      world: featuredOrder(players, recentSet, seed).slice(0, HOME_FEATURED_LIMIT),
      tr: featuredOrder(players, recentSet, seed, "TR").slice(0, HOME_FEATURED_LIMIT)
    },
    recent: latest
      .flatMap((entry) => {
        const player = byLogin.get(entry.login.toLowerCase())
        return player ? [{ player, addedAt: entry.addedAt }] : []
      })
      .slice(0, HOME_RECENT_LIMIT),
    countries: {
      top: countries.slice(0, HOME_COUNTRY_FLAGS).map((entry) => entry.country),
      total: countries.length
    },
    lastDayCount,
    generatedAt: new Date(at).toISOString()
  }
})

const leaderboardSliceSchema = leaderboardSearchSchema
  .pick({
    q: true,
    pos: true,
    rarity: true,
    country: true,
    program: true,
    verified: true,
    sort: true,
    dir: true,
    limit: true
  })
  .extend({ locale: z.enum(locales) })

/** One page of the leaderboard plus its filter options; the table never receives the whole list. */
export const getLeaderboardSlice = createServerFn({ method: "GET" })
  .validator(leaderboardSliceSchema)
  .handler(
    async ({
      data
    }): Promise<{
      slice: LeaderboardSlice
      facets: LeaderboardFacets
      dailyBest: ListPlayer[]
    }> => {
      const { players, recentLogins } = await cachedList()
      return {
        slice: queryLeaderboard(players, data, data.locale),
        facets: leaderboardFacets(players),
        dailyBest: dailyBest(players, recentLogins)
      }
    }
  )

/** Rows a player search returns; the picker shows a short list and narrows as you type. */
const SEARCH_LIMIT = 20

const loginSchema = z.string().min(1).max(39)

const searchPlayersSchema = z.object({
  q: z.string().max(100),
  /** Logins to leave out, e.g. the other side of a duel or players already picked. */
  exclude: z.array(loginSchema).max(10).default([]),
  locale: z.enum(locales)
})

/** Players matching a name or login, best OVR first; an empty query returns the top players. */
export const searchPlayers = createServerFn({ method: "GET" })
  .validator(searchPlayersSchema)
  .handler(async ({ data }): Promise<ListPlayer[]> => {
    const players = await cachedPlayers()
    const excluded = new Set(data.exclude.map((login) => login.toLowerCase()))
    const results: ListPlayer[] = []
    for (const player of players) {
      if (results.length === SEARCH_LIMIT) break
      if (excluded.has(player.login.toLowerCase())) continue
      if (matchesPlayer(player, data.q, data.locale)) results.push(player)
    }
    return results
  })

/** The listed players in the given order; unknown logins are skipped. */
export const getPlayersByLogin = createServerFn({ method: "GET" })
  .validator(z.object({ logins: z.array(loginSchema).max(10) }))
  .handler(async ({ data }): Promise<ListPlayer[]> => {
    const players = await cachedPlayers()
    const byLogin = new Map(players.map((player) => [player.login.toLowerCase(), player]))
    return data.logins.flatMap((login) => byLogin.get(login.toLowerCase()) ?? [])
  })

/** A random player for the duel picker's dice button, never one of `exclude`. */
export const getRandomPlayer = createServerFn({ method: "GET" })
  .validator(z.object({ exclude: z.array(loginSchema).max(2).default([]) }))
  .handler(async ({ data }): Promise<ListPlayer | null> => {
    const excluded = new Set(data.exclude.map((login) => login.toLowerCase()))
    const pool = (await cachedPlayers()).filter(
      (player) => !excluded.has(player.login.toLowerCase())
    )
    return pool[Math.floor(Math.random() * pool.length)] ?? null
  })

/** Popular duels shown under the picker. */
const POPULAR_PRESETS = 3

/**
 * Popular duel suggestions for Türkiye and the world. Without a seed the current hour is used, so the
 * server and the browser draw the same pairs; "shuffle" asks again with a random seed.
 */
export const getDuelPresets = createServerFn({ method: "GET" })
  .validator(z.object({ seed: z.number().int().nonnegative().optional() }))
  .handler(async ({ data }): Promise<{ seed: number; tr: DuelPreset[]; world: DuelPreset[] }> => {
    const { players, profileViews } = await cachedList()
    const seed = data.seed ?? Math.floor(Date.now() / HOUR_MS)
    const turkish = players.filter((player) => playerCountry(player) === "TR")
    return {
      seed,
      tr: popularPresets(turkish, seed, profileViews, POPULAR_PRESETS),
      world: popularPresets(players, seed, profileViews, POPULAR_PRESETS)
    }
  })

/**
 * The fallback card on the special cards page: the site owner's, else the top player. Nothing personal,
 * since pages may be cached; the browser swaps in the viewer's own card after sign-in is known.
 */
export const getSpecialCardsSample = createServerFn({ method: "GET" }).handler(
  async (): Promise<ListPlayer | null> => {
    const players = await cachedPlayers()
    const owner = SPECIAL_CARDS_SAMPLE_LOGIN.toLowerCase()
    return players.find((player) => player.login.toLowerCase() === owner) ?? players[0] ?? null
  }
)

/**
 * GitHub hataları istemciye sabit bir kodla gider (`github:not-found`); mesaj arayüzde dile göre yazılır.
 * Sunucu tarafındaki ayrıntı `cause` içinde ve logda kalır.
 */
async function fetchFacts(login: string, onStage?: (stage: ScoutingStage) => void) {
  try {
    return await fetchPlayerFacts(login, new Date(), onStage)
  } catch (error) {
    if (error instanceof GithubError) throw new Error(`github:${error.kind}`, { cause: error })
    throw error
  }
}

/**
 * Sınır dolduğunda ya da token yokken GitHub'a gidilmez, kota harcanmaz. Diğer hatalarda sorgu GitHub'a
 * ulaşmıştır; bulunamayan ad ayrıca hatırlanır.
 */
function classifyLookupFailure(error: unknown): LookupFailure {
  if (!(error instanceof Error)) return "costly"
  // Saatlik sınırın ve IP sınırının kendi hataları: nedeni yok, GitHub'a gidilmedi.
  if (error.message === "github:rate-limit" && error.cause === undefined) return "free"
  if (error.message === "limit:ip-lookups") return "free"
  const { cause } = error
  if (!(cause instanceof GithubError)) return "costly"
  if (cause.kind === "not-found") return "not-found"
  if (cause.kind === "rate-limit" || cause.kind === "missing-token") return "free"
  return "costly"
}

const lookups = createLookupGuard({
  windowMs: HOUR_MS,
  notFoundTtlMs: NOT_FOUND_TTL_MS,
  classify: classifyLookupFailure
})

/**
 * İsteği yapanın IP kovası. Vercel X-Forwarded-For başlığını kendisi yazar; istemcinin gönderdiği değer
 * kullanılmaz. Akışlı yanıtta istek bağlamı sonradan kaybolabileceği için işleyicinin başında okunur.
 */
function requestIpBucket(): string {
  return ipBucket(getRequestIP({ xForwardedFor: true }))
}

/**
 * Oyuncu kayıtlıysa GitHub'a gitmeden döner. Değilse bir kez çekilip kaydedilir;
 * kayıtlı veri sonradan değiştirilemez. Saatlik sınıra başarısız sorgular da sayılır: yoksa var olmayan
 * adlarla GitHub kotası sınırsızca harcanabilir ve yeni kartlar da yenileme de durur.
 */
async function createPlayer(
  username: string,
  lookupBucket: string,
  onStage?: (stage: ScoutingStage) => void
): Promise<ScoredPlayer> {
  const existing = await getScoredPlayer(username)
  if (existing) return existing

  // Aynı ad için süren sorguya katılan istek aşama bildirimi almaz; yalnızca sonucu bekler.
  return lookups.run(username.toLowerCase(), async () => {
    if ((await countRecentPlayers()) + lookups.recentFailures() >= NEW_PLAYERS_PER_HOUR) {
      throw new Error("github:rate-limit")
    }
    // Hak yalnızca GitHub'a gerçekten gidilecekken harcanır: kayıtlı kart, süren sorgu ve az önce
    // bulunamayan ad buraya hiç ulaşmaz.
    // IP okunamazsa herkes aynı kovaya düşer ve site toptan kilitlenirdi; o durumda yalnızca ortak sınır geçerli.
    if (lookupBucket === UNKNOWN_IP_BUCKET) {
      console.warn("[limit] istek IP'si okunamadı; kişi başı sınır atlandı")
    } else if (!(await takeLookup(lookupBucket, NEW_LOOKUPS_PER_IP))) {
      throw new Error("limit:ip-lookups")
    }

    const facts = await fetchFacts(username, onStage)
    const player = await insertPlayer({
      login: facts.login,
      fetchedAt: new Date().toISOString(),
      facts
    })
    listCache = null
    return player
  })
}

export const addPlayer = createServerFn({ method: "POST" })
  .validator(addPlayerSchema)
  .handler(
    async ({ data }): Promise<ScoredPlayer> => await createPlayer(data.username, requestIpBucket())
  )

/**
 * `addPlayer` ile aynı işi yapar; GitHub'dan veri toplanırken biten her aşamayı akışla bildirir.
 * Kayıtlı oyuncuda aşama gelmez, doğrudan `done` döner. Hata, akış okunurken fırlatılır.
 */
export const addPlayerStream = createServerFn({ method: "POST" })
  .validator(addPlayerSchema)
  .handler(async function* ({ data }): AsyncGenerator<AddPlayerEvent> {
    // Aşamalar geri çağrıyla gelir; kuyruk onları sırayla akışa aktarır.
    const queue: AddPlayerEvent[] = []
    // Geri çağrılar bu nesneyi değiştirir; ayrı değişkenler döngüde hep ilk değeriyle görünürdü.
    const signal: { finished: boolean; wake?: () => void } = { finished: false }
    const push = (event: AddPlayerEvent) => {
      queue.push(event)
      signal.wake?.()
    }

    const task = createPlayer(data.username, requestIpBucket(), (stage) =>
      push({ type: "stage", ...stage })
    )
      .then((player) => push({ type: "done", player }))
      .finally(() => {
        signal.finished = true
        signal.wake?.()
      })

    for (;;) {
      const next = queue.shift()
      if (next) {
        yield next
        continue
      }
      if (signal.finished) break
      await new Promise<void>((resolve) => {
        signal.wake = resolve
      })
      signal.wake = undefined
    }
    // Hata varsa burada yeniden fırlar ve istemcide akışı okuyan döngüye ulaşır.
    await task
  })

/** Aynı kişinin ülke değişiklikleri arasında en az bu kadar saniye geçer. */
const COUNTRY_UPDATE_INTERVAL_SECONDS = 10

const updateCountrySchema = z.object({ country: z.enum(COUNTRIES).nullable() })

/**
 * Giriş yapmış ve onaylı kişinin ülkesini değiştirir; `null` seçimi kaldırır. Kim olduğu yalnızca sunucudaki
 * oturum çerezinden okunur: istekte kullanıcı adı ya da kimlik alınmaz, kişi yalnızca kendi kaydını değiştirebilir.
 */
export const updateProfileCountry = createServerFn({ method: "POST" })
  .validator(updateCountrySchema)
  .handler(async ({ data }): Promise<void> => {
    const viewer = await getCurrentViewer()
    if (!viewer) throw new Error("account:signed-out")
    if (!viewer.eligible) throw new Error("account:not-eligible")
    const updated = await updateAccountCountry(
      viewer.githubId,
      data.country,
      COUNTRY_UPDATE_INTERVAL_SECONDS
    )
    if (!updated) throw new Error("account:rate-limit")
    listCache = null
  })

/** GitHub 13 yaş altına hesap açtırmaz; üst sınır yazım hatalarını yakalar. */
const BIRTH_AGE_RANGE = { min: 13, max: 100 } as const

const updateBirthDateSchema = z.object({
  birthDate: z.iso.date().refine((value) => {
    const age = ageOn(value, new Date())
    return age !== null && age >= BIRTH_AGE_RANGE.min && age <= BIRTH_AGE_RANGE.max
  })
})

/**
 * Giriş yapmış ve onaylı kişinin doğum tarihini kaydeder. İlk kayıt ve bir düzeltme hakkı vardır;
 * sınır SQL'de uygulanır. Kişi yalnızca oturum çerezinden okunur, kendi kaydından başkasına yazamaz.
 */
export const updateBirthDate = createServerFn({ method: "POST" })
  .validator(updateBirthDateSchema)
  .handler(async ({ data }): Promise<void> => {
    const viewer = await getCurrentViewer()
    if (!viewer) throw new Error("account:signed-out")
    if (!viewer.eligible) throw new Error("account:not-eligible")
    const updated = await updateAccountBirthDate(viewer.githubId, data.birthDate)
    if (!updated) throw new Error("account:birth-date-locked")
  })

/**
 * Giriş yapmış ve onaylı kişinin şehir, cinsiyet, rüya takımı ve favori takımını kaydeder; yalnızca gönderilen alanlar değişir.
 * Kişi oturum çerezinden okunur. Kendini kadrosuna ekleyemez; listede olmayan oyuncu seçilemez.
 */
export const updateProfileDetails = createServerFn({ method: "POST" })
  .validator(profileDetailsSchema)
  .handler(async ({ data }): Promise<void> => {
    const viewer = await getCurrentViewer()
    if (!viewer) throw new Error("account:signed-out")
    if (!viewer.eligible) throw new Error("account:not-eligible")
    if (data.dreamTeam?.includes(viewer.login.toLowerCase()))
      throw new Error("account:dream-team-self")
    // Kalıcı kart yüzü: GitHub Star kartı yalnızca programdakilere, takım kartı favori takım seçiliyken.
    if (data.cardFace === "github-star" && !isGithubStar(viewer.login))
      throw new Error("account:card-face-not-allowed")
    const team = data.favoriteTeam !== undefined ? data.favoriteTeam : viewer.favoriteTeam
    if (data.cardFace === "team" && !team) throw new Error("account:card-face-not-allowed")
    const result = await updateAccountProfileDetails(viewer.githubId, data)
    if (result === "not-eligible") throw new Error("account:not-eligible")
    if (result === "unknown-player") throw new Error("account:dream-team-unknown-player")
    if (result === "rate-limit") throw new Error("account:rate-limit")
  })
