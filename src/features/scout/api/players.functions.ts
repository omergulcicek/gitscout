import { notFound } from "@tanstack/react-router"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { getRequestIP } from "@tanstack/react-start/server"
import { z } from "zod"

import { getCurrentViewer } from "@/lib/auth.functions"

import { fetchPlayerFacts } from "@/features/scout/api/fetch-player-facts.api"
import { GithubError } from "@/features/scout/api/get-github-data.api"
import { createLookupGuard } from "@/features/scout/api/lookup-guard"
import type { LookupFailure } from "@/features/scout/api/lookup-guard"
import {
  countRecentPlayers,
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
import { COUNTRIES } from "@/features/scout/constants/player-country.constants"
import {
  NEW_LOOKUPS_PER_IP,
  NEW_PLAYERS_PER_HOUR,
  NOT_FOUND_TTL_MS
} from "@/features/scout/constants/scoring.constants"
import { computeBenchmarks } from "@/features/scout/helpers/benchmarks"
import { ageOn } from "@/features/scout/helpers/birthday"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { ipBucket, UNKNOWN_IP_BUCKET } from "@/features/scout/helpers/ip-bucket"
import { computeRanking } from "@/features/scout/helpers/score-player"
import { addPlayerSchema, usernameSchema } from "@/features/scout/schemas/player.schema"
import { profileDetailsSchema } from "@/features/scout/schemas/profile.schema"
import type { AddPlayerEvent, ScoutingStage } from "@/features/scout/types/add-player.types"
import type { ListPlayer, PlayerDetail, ScoredPlayer } from "@/features/scout/types/player.types"

type Leaderboard = {
  players: ListPlayer[]
  /** Son 24 saatte eklenenler; vitrinde daha sık çıkarlar. */
  recentLogins: string[]
  /**
   * Vitrin tohumu: Unix saat numarası. Sunucuda hesaplanıp veriyle gider, böylece
   * sunucuda çizilen kart ile tarayıcıdaki kart saat dönümünde bile aynı kalır.
   */
  featuredSeed: number
  /** En son eklenenler, yeniden eskiye. */
  latest: LatestAddition[]
  /** Verinin üretildiği andan önceki 24 saatte eklenen oyuncu sayısı. */
  lastDayCount: number
  /** Son 7 günde profil görüntülenmeleri (küçük harfli kullanıcı adı → tekil ziyaretçi); hazır kapışmaları ağırlıklandırır. */
  profileViews: Record<string, number>
  /**
   * Verinin üretildiği an. "5 dk önce" gibi göreli zamanlar buna göre yazılır; sunucu ile
   * tarayıcı aynı metni üretir.
   */
  generatedAt: string
}

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

/** Kayıtlı bütün oyuncular, genel puana göre sıralı. GitHub'a istek atmaz. */
export const getLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<Leaderboard> => {
    const { at, players, recentLogins, latest, lastDayCount, profileViews } = await cachedList()
    return {
      players,
      recentLogins,
      latest,
      lastDayCount,
      profileViews,
      featuredSeed: Math.floor(Date.now() / HOUR_MS),
      generatedAt: new Date(at).toISOString()
    }
  }
)

export const getPlayer = createServerFn({ method: "GET" })
  // Geçersiz kullanıcı adı doğrulama hatası (500) değil, "bulunamadı" (404) sayılır.
  .validator(z.object({ username: z.string() }))
  .handler(async ({ data }): Promise<PlayerDetail> => {
    const username = usernameSchema.safeParse(data.username)
    if (!username.success) throw notFound()
    const player = await getScoredPlayer(username.data)
    if (!player) throw notFound()
    const all = await cachedPlayers()
    return {
      ...player,
      ranking: computeRanking(player, all),
      benchmarks: computeBenchmarks(player, all)
    }
  })

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
