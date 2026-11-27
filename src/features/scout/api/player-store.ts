import { z } from "zod"

import { CARD_FACES } from "@/constants/account.constants"
import type { CardFace, Gender } from "@/constants/account.constants"
import { TEAMS } from "@/constants/team.constants"
import type { Team } from "@/constants/team.constants"

import { getDb, getRefreshDb } from "@/lib/db"

import { COUNTRIES, HIDDEN_COUNTRY } from "@/features/scout/constants/player-country.constants"
import { REFRESH, SCORE_VERSION } from "@/features/scout/constants/scoring.constants"
import { isBirthdayToday } from "@/features/scout/helpers/birthday"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { toListPlayer } from "@/features/scout/helpers/list-player"
import { scorePlayer } from "@/features/scout/helpers/score-player"
import { isWomensDay } from "@/features/scout/helpers/special-days"
import {
  listPlayerSchema,
  scoredPlayerSchema,
  storedPlayerSchema
} from "@/features/scout/schemas/player.schema"
import type { ListPlayer, ScoredPlayer, StoredPlayer } from "@/features/scout/types/player.types"
import type { FrozenSeason } from "@/features/scout/types/season.types"

/**
 * Oyuncular Supabase'deki `gitscout.players` tablosunda durur. Her oyuncu GitHub'dan bir kez çekilir ve
 * bir daha değişmez; uygulama rolünün silme ya da ham veriyi güncelleme yetkisi yoktur.
 * Listeler ~3 KB'lık puan özetinden beslenir; ~70 KB'lık ham veri yalnızca puanlamada okunur.
 */

const summaryRowSchema = z.object({
  login: z.string(),
  scored: scoredPlayerSchema,
  score_version: z.number()
})

const factsRowSchema = z.object({
  login: z.string(),
  facts: z.unknown(),
  fetched_at: z.date()
})

const keyOf = (login: string) => login.toLowerCase()

/** Ham veriden puanlar; veri çekildiği andaki haliyle puanlanır, böylece sonuç zamanla kaymaz. */
function scoreStored(stored: StoredPlayer): ScoredPlayer {
  return scorePlayer(stored, new Date(stored.fetchedAt))
}

/**
 * Bir liste isteğinde en fazla bu kadar eski özet yeniden puanlanır. Formül sürümü artınca bütün
 * oyuncular birden eskir; hepsini tek istekte puanlamak ~11 MB ham veri okur ve rolün 8 sn'lik
 * `statement_timeout` sınırına takılıp siteyi düşürür. Kalanlar o arada eski özetleriyle görünür.
 */
const RESCORE_PER_REQUEST = 25

/**
 * Yerel geliştirme canlı veritabanına bağlı. Yereldeki bir formül denemesi canlı puanların üstüne
 * yazmasın diye yeniden puanlama yerelde yalnızca bellekte yapılır, veritabanına yazılmaz.
 */
const PERSIST_RESCORE = !import.meta.env.DEV

/** Özet bu kodun formülünden eski mi? Daha yeni sürüm (yeni deploy) olduğu gibi kullanılır, geri puanlanmaz. */
const isOutdated = (version: number) => version < SCORE_VERSION

/** Eski formül sürümüyle yazılmış özetleri ham veriden yeniden hesaplar ve tek sorguyla günceller. */
async function rescore(logins: string[]): Promise<ScoredPlayer[]> {
  if (logins.length === 0) return []
  const sql = getDb()
  const rows = z
    .array(factsRowSchema)
    .parse(await sql`select login, facts, fetched_at from players where login in ${sql(logins)}`)

  const scored: { login: string; player: ScoredPlayer }[] = []
  for (const row of rows) {
    const parsed = storedPlayerSchema.safeParse({
      login: row.login,
      fetchedAt: row.fetched_at.toISOString(),
      facts: row.facts
    })
    if (!parsed.success) {
      // Biçimi artık uymayan kayıt listeden çıkar; ham veri olduğu gibi saklanır.
      console.error("[db] puanlanamayan kayıt", row.login)
      continue
    }
    scored.push({ login: row.login, player: scoreStored(parsed.data) })
  }

  if (PERSIST_RESCORE && scored.length > 0) {
    const values = scored.map(({ login, player }) => [login, JSON.stringify(player), player.ovr])
    await sql`
      update players as p
      set scored = v.scored::jsonb, score_version = ${SCORE_VERSION}, ovr = v.ovr::smallint
      from (values ${sql(values)}) as v(login, scored, ovr)
      where p.login = v.login
    `
  }
  return scored.map(({ player }) => player)
}

/** Onay hesap tablosundan, ülke `players.country` sütunundan gelir. Puan özetine yazılmaz, her okumada eklenir. */
const accountColumnsSchema = z.object({
  verified: z.boolean(),
  claimed_country: z.string().nullable()
})

type AccountColumns = z.infer<typeof accountColumnsSchema>

/** Onay ve veritabanındaki ülke oyuncuya eklenir; yalnızca doluysa alan yazılır ki liste yükü büyümesin. */
function withAccount<T extends ListPlayer | ScoredPlayer>(player: T, account: AccountColumns): T {
  const claimedCountry = COUNTRIES.find((country) => country === account.claimed_country)
  const hidesLocationCountry = account.claimed_country === HIDDEN_COUNTRY
  return {
    ...player,
    ...(hidesLocationCountry ? { country: undefined } : {}),
    ...(account.verified ? { verified: true } : {}),
    ...(claimedCountry ? { claimedCountry } : {})
  }
}

/** Bütün oyuncular, genel puana göre sıralı. */
const listRowSchema = accountColumnsSchema.extend({
  login: z.string(),
  summary: listPlayerSchema,
  score_version: z.number()
})

/**
 * Bütün oyuncular, liste ekranlarının ihtiyacı kadar veriyle, genel puana göre sıralı. Hafifletme
 * SQL'de yapılır: veritabanı uzak bölgede olduğu için taşınan her bayt istek süresine yansır.
 * Rol dağılımı, repolar, arşetip ve stat parçaları atılır; statlardan yalnızca görünen puan kalır.
 */
export async function getListPlayers(): Promise<{ players: ListPlayer[]; pending: number }> {
  const sql = getDb()
  const rows = z.array(listRowSchema).parse(
    await sql`
      select p.login, p.score_version,
        (p.scored - 'positionBreakdown' - 'topRepos' - 'archetype' - 'stats' #- '{year,weeklyTotals}')
          || jsonb_build_object('stats', (
            select jsonb_object_agg(k, jsonb_build_object('key', k, 'value', v -> 'value'))
            from jsonb_each(p.scored -> 'stats') as s(k, v)
          )) as summary,
        coalesce(a.eligible, false) as verified,
        p.country as claimed_country
      from players p
      -- Linked by GitHub's account id, never the login: a login can change hands.
      left join accounts a on a.github_id = p.github_id
      order by p.ovr desc, p.login
    `
  )

  const outdated = rows.filter((row) => isOutdated(row.score_version)).map((row) => row.login)
  const rescored = new Map(
    (await rescore(outdated.slice(0, RESCORE_PER_REQUEST))).map((player) => [
      keyOf(player.login),
      toListPlayer(player)
    ])
  )
  const players = rows.map((row) => withAccount(rescored.get(keyOf(row.login)) ?? row.summary, row))
  return {
    players: players.sort((a, b) => b.ovrExact - a.ovrExact || a.login.localeCompare(b.login)),
    // Yerelde yazılmadığı için hiç azalmaz; önbelleği kısaltmamak için sıfır sayılır.
    pending: PERSIST_RESCORE ? Math.max(0, outdated.length - rescored.size) : 0
  }
}

/**
 * Kayıtlı kart yüzünü profilde gösterilecek karta çevirir. Koşul artık geçerli değilse (takım kaldırıldı,
 * kişi GitHub Stars listesinden çıktı) gerçek karta düşer.
 */
function resolveCardFace(
  login: string,
  face: CardFace | null,
  team: Team | null
): Team | "github-star" | undefined {
  if (face === "team" && team) return team
  if (face === "github-star" && isGithubStar(login)) return "github-star"
  return undefined
}

export async function getScoredPlayer(login: string): Promise<ScoredPlayer | null> {
  const sql = getDb()
  const rows = z
    .array(
      summaryRowSchema.extend(accountColumnsSchema.shape).extend({
        birth_month_day: z.string().nullable(),
        utc_offset_minutes: z.number().nullable(),
        female: z.boolean(),
        card_face: z.enum(CARD_FACES).nullable().catch(null),
        favorite_team: z.enum(TEAMS).nullable().catch(null)
      })
    )
    .parse(
      await sql`
      select p.login, p.scored, p.score_version,
        coalesce(a.eligible, false) as verified,
        p.country as claimed_country,
        case when a.eligible then to_char(a.birth_date, 'MM-DD') end as birth_month_day,
        coalesce(a.eligible and a.gender = 'female', false) as female,
        case when a.eligible then a.card_face end as card_face,
        case when a.eligible then a.favorite_team end as favorite_team,
        -- Ham veri yalnızca doğum tarihi girilmişse ve yalnızca bu alan için okunur.
        case when a.eligible and a.birth_date is not null
          then (p.facts ->> 'utcOffsetMinutes')::int end as utc_offset_minutes
      from players p
      -- Linked by GitHub's account id, never the login: a login can change hands.
      left join accounts a on a.github_id = p.github_id
      where p.login = ${keyOf(login)}
    `
    )
  const row = rows[0]
  if (!row) return null
  const player = isOutdated(row.score_version) ? (await rescore([row.login]))[0] : row.scored
  if (!player) return null
  // Doğum tarihinin kendisi tarayıcıya gitmez; yalnızca bugün doğum günü olup olmadığı.
  const birthday =
    row.birth_month_day !== null &&
    isBirthdayToday(row.birth_month_day, new Date(), row.utc_offset_minutes)
  // Cinsiyetin kendisi de gitmez; yalnızca bugün Kadınlar Günü kartının çıkıp çıkmayacağı.
  const womensDay = row.female && isWomensDay(new Date())
  const cardFace = resolveCardFace(row.login, row.card_face, row.favorite_team)
  return {
    ...withAccount(player, row),
    ...(birthday ? { birthdayToday: true } : {}),
    ...(womensDay ? { womensDayToday: true } : {}),
    ...(cardFace ? { cardFace } : {})
  }
}

/**
 * Onaylı hesabın doğum tarihini yazar. İlk kayıt ve bir düzeltme: en fazla iki kez yazılabilir.
 * Aynı tarihi yeniden göndermek hak harcatmaz. Yazılamadıysa `false`.
 */
export async function updateAccountBirthDate(
  githubId: number,
  birthDate: string
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    update accounts
    set birth_date = ${birthDate}::date, birth_date_changes = birth_date_changes + 1, updated_at = now()
    where github_id = ${githubId}
      and eligible
      and birth_date_changes < 2
      and birth_date is distinct from ${birthDate}::date
    returning github_id
  `
  return rows.length > 0
}

/**
 * Writes the verified owner's country to `players.country`, the single source the cards read; `null` falls back to
 * the GitHub location. The rate limit lives in SQL: nothing is written until this many seconds pass since the last change.
 */
export async function updateAccountCountry(
  githubId: number,
  country: string | null,
  minIntervalSeconds: number
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    with account as (
      update accounts
      set country_updated_at = now(), updated_at = now()
      where github_id = ${githubId}
        and eligible
        and login is not null
        and (country_updated_at is null
          or country_updated_at < now() - make_interval(secs => ${minIntervalSeconds}))
      returning github_id
    )
    update players as p
    set country = ${country}
    from account
    where p.github_id = account.github_id
    returning p.login
  `
  return rows.length > 0
}

/** Profil bilgileri kayıtları arasında en az bu kadar saniye geçer; art arda yazmayı keser. */
const PROFILE_UPDATE_INTERVAL_SECONDS = 3

export type AccountProfileDetails = {
  city?: string | null
  gender?: Gender | null
  /** Kullanıcı adları, seçilen sırayla; boş dizi kadroyu temizler. */
  dreamTeam?: string[]
  favoriteTeam?: Team | null
  cardFace?: CardFace | null
}

/**
 * Onaylı hesabın isteğe bağlı profil bilgilerini tek işlemde yazar; yalnızca gönderilen alanlar değişir.
 * Kadro silinip yeniden yazılır. Hesap onaylı değilse ya da kadroda listede olmayan bir oyuncu varsa
 * hiçbir şey yazılmaz: denetimler yazmadan önce yapılır.
 */
export async function updateAccountProfileDetails(
  githubId: number,
  details: AccountProfileDetails
): Promise<"ok" | "not-eligible" | "unknown-player" | "rate-limit"> {
  const sql = getDb()
  return sql.begin(async (tx) => {
    // Satır kilitlenir: aynı anda gelen iki kayıt sırayla işlenir, sıklık sınırı atlanamaz.
    const [account] = z.array(z.object({ recent: z.boolean() })).parse(
      await tx`
          select coalesce(profile_updated_at > now() - make_interval(secs => ${PROFILE_UPDATE_INTERVAL_SECONDS}), false) as recent
          from accounts where github_id = ${githubId} and eligible
          for update
        `
    )
    if (!account) return "not-eligible"
    if (account.recent) return "rate-limit"

    const logins = details.dreamTeam
    if (logins && logins.length > 0) {
      const [found] = z
        .array(z.object({ count: z.coerce.number() }))
        .parse(await tx`select count(*) from players where login = any(${sql.array(logins)})`)
      if (found?.count !== logins.length) return "unknown-player"
    }

    if (details.city !== undefined) {
      await tx`
        update accounts set city = ${details.city}, city_updated_at = now(), updated_at = now()
        where github_id = ${githubId} and city is distinct from ${details.city}
      `
    }
    if (details.gender !== undefined) {
      await tx`
        update accounts set gender = ${details.gender}, gender_updated_at = now(), updated_at = now()
        where github_id = ${githubId} and gender is distinct from ${details.gender}
      `
    }
    if (details.favoriteTeam !== undefined) {
      await tx`
        update accounts
        set favorite_team = ${details.favoriteTeam}, favorite_team_updated_at = now(), updated_at = now()
        where github_id = ${githubId} and favorite_team is distinct from ${details.favoriteTeam}
      `
    }
    if (details.cardFace !== undefined) {
      await tx`
        update accounts set card_face = ${details.cardFace}, updated_at = now()
        where github_id = ${githubId} and card_face is distinct from ${details.cardFace}
      `
    }
    if (logins !== undefined) {
      await tx`delete from dream_team_picks where github_id = ${githubId}`
      for (const [index, login] of logins.entries()) {
        await tx`
          insert into dream_team_picks (github_id, slot, player_login)
          values (${githubId}, ${index + 1}, ${login})
        `
      }
    }
    await tx`update accounts set profile_updated_at = now(), updated_at = now() where github_id = ${githubId}`
    return "ok"
  })
}

/** Site haritası için bütün oyuncuların kullanıcı adı ve verinin tarihi; özet ya da ham veri okunmaz. */
export async function getSitemapPlayers(): Promise<{ login: string; fetchedAt: Date }[]> {
  const sql = getDb()
  const rows = z
    .array(z.object({ login: z.string(), fetched_at: z.date() }))
    .parse(await sql`select login, fetched_at from players order by ovr desc, login`)
  return rows.map((row) => ({ login: row.login, fetchedAt: row.fetched_at }))
}

/** Son 24 saatte eklenen oyuncuların kullanıcı adları; ana sayfa vitrininde öne çıkarılırlar. */
export async function getRecentLogins(): Promise<string[]> {
  const sql = getDb()
  const rows = z
    .array(z.object({ login: z.string() }))
    .parse(await sql`select login from players where created_at > now() - interval '24 hours'`)
  return rows.map((row) => row.login)
}

/** En son eklenen oyuncular, yeniden eskiye; ana sayfadaki "Son eklenenler" şeridi için. */
export async function getLatestAdditions(
  limit: number
): Promise<{ login: string; addedAt: string }[]> {
  const sql = getDb()
  const rows = z
    .array(z.object({ login: z.string(), created_at: z.date() }))
    .parse(await sql`select login, created_at from players order by created_at desc limit ${limit}`)
  return rows.map((row) => ({ login: row.login, addedAt: row.created_at.toISOString() }))
}

/**
 * IP kovası için bir yeni kart sorgusu hakkı harcar. Sınır doluysa hak harcanmaz ve `false` döner.
 * Sayım veritabanında tutulur; sunucu örnekleri arasında ortaktır ve eşzamanlı isteklerde aşılamaz.
 */
export async function takeLookup(
  bucket: string,
  limits: { hour: number; day: number }
): Promise<boolean> {
  const sql = getDb()
  const [row] = z
    .array(z.object({ ok: z.boolean() }))
    .parse(await sql`select gitscout.take_lookup(${bucket}, ${limits.hour}, ${limits.day}) as ok`)
  return row?.ok ?? false
}

/** Son `hours` saatte eklenen oyuncu sayısı. Saatlik sayım kişisel veri tutmadan toplu eklemeyi sınırlar; günlük sayım ana sayfada gösterilir. */
export async function countRecentPlayers(hours = 1): Promise<number> {
  const sql = getDb()
  const [row] = z
    .array(z.object({ count: z.coerce.number() }))
    .parse(
      await sql`select count(*) as count from players where created_at > now() - make_interval(hours => ${hours})`
    )
  return row?.count ?? 0
}

/**
 * Son `days` UTC gününde profil görüntülenmeleri (en çok bakılan 300 kişi), küçük harfli kullanıcı adına göre.
 * Hazır kapışmalarda kimin daha sık çıkacağını belirler. Sayaç tabloları yardımcı veridir: okunamazsa
 * hata raporlanır ve boş döner, liste ve kapışma sayfası ağırlıksız çalışmaya devam eder.
 */
export async function getRecentProfileViews(days = 7): Promise<Record<string, number>> {
  try {
    const sql = getDb()
    const rows = z.array(z.object({ login: z.string(), views: z.coerce.number() })).parse(
      await sql`
        select login, sum(views) as views
        from profile_views
        where day > (now() at time zone 'utc')::date - ${days}::int
        group by login
        order by views desc
        limit 300
      `
    )
    return Object.fromEntries(rows.map((row) => [row.login, row.views]))
  } catch (error) {
    console.error("Could not read profile views", error)
    return {}
  }
}

/**
 * Yeni oyuncuyu kaydeder. Kayıt zaten varsa hiçbir şey değişmez ve var olan özet döner:
 * aynı anda gelen iki istekten ilki kazanır.
 */
export async function insertPlayer(input: StoredPlayer): Promise<ScoredPlayer> {
  const stored = storedPlayerSchema.parse(input)
  const player = scoreStored(stored)
  const sql = getDb()
  await sql`
    insert into players (login, facts, scored, score_version, ovr, fetched_at)
    values (
      ${keyOf(stored.facts.login)},
      ${sql.json(stored.facts)},
      ${sql.json(player)},
      ${SCORE_VERSION},
      ${player.ovr},
      ${stored.fetchedAt}
    )
    on conflict (login) do nothing
  `
  return (await getScoredPlayer(stored.facts.login)) ?? player
}

/* ---------- Haftalık yenileme (yalnızca gitscout_refresher rolüyle) ---------- */

/** Verisi en eski olan ve `maxAgeDays` günü geçmiş kartlar. */
export async function getStaleLogins(limit: number): Promise<string[]> {
  const sql = getRefreshDb()
  const rows = z.array(z.object({ login: z.string() })).parse(
    await sql`
      select login from players
      where fetched_at < now() - make_interval(days => ${REFRESH.maxAgeDays})
      order by fetched_at asc
      limit ${limit}
    `
  )
  return rows.map((row) => row.login)
}

/** Kartın ham verisini ve puan özetini GitHub'dan yeni çekilen veriyle değiştirir. */
export async function replacePlayerFacts(login: string, input: StoredPlayer): Promise<void> {
  const stored = storedPlayerSchema.parse(input)
  const player = scoreStored(stored)
  const sql = getRefreshDb()
  await sql`
    update players
    set facts = ${sql.json(stored.facts)},
        scored = ${sql.json(player)},
        score_version = ${SCORE_VERSION},
        ovr = ${player.ovr},
        fetched_at = ${stored.fetchedAt}
    where login = ${keyOf(login)}
  `
}

/** GitHub'da artık bulunamayan hesap sıranın sonuna alınır; veri olduğu gibi kalır. */
export async function postponePlayer(login: string): Promise<void> {
  const sql = getRefreshDb()
  await sql`update players set fetched_at = now() where login = ${keyOf(login)}`
}

/* ---------- Puan ve sıra geçmişi (yalnızca gitscout_refresher rolüyle) ---------- */

/** Son turun anı ve formül sürümü; tablo boşsa `null`. */
export async function getLatestSnapshot(): Promise<{ takenAt: Date; scoreVersion: number } | null> {
  const sql = getRefreshDb()
  const [row] = z
    .array(z.object({ taken_at: z.date(), score_version: z.number() }))
    .parse(
      await sql`select taken_at, score_version from player_snapshots order by taken_at desc limit 1`
    )
  return row ? { takenAt: row.taken_at, scoreVersion: row.score_version } : null
}

/** Puanı bu kodun formül sürümünden farklı bir sürümle yazılmış oyuncu sayısı. */
export async function countUnsettledScores(): Promise<number> {
  const sql = getRefreshDb()
  const [row] = z
    .array(z.object({ count: z.coerce.number() }))
    .parse(await sql`select count(*) as count from players where score_version <> ${SCORE_VERSION}`)
  return row?.count ?? 0
}

/**
 * Bütün oyuncuların puanını ve sırasını tek turda, aynı anla yazar; yazılan satır sayısını döner.
 * Sıra liderlik tablosuyla aynı: yuvarlanmamış puana, eşitlikte kullanıcı adına göre. Sayımdan sonra
 * puanı başka bir sürümle yazılan oyuncu çıkarsa tur yazılmaz (0 döner).
 */
export async function insertSnapshot(takenAt: Date): Promise<number> {
  const sql = getRefreshDb()
  const result = await sql`
    insert into player_snapshots (login, taken_at, ovr, rank, score_version)
    select login, ${takenAt}, ovr,
      row_number() over (order by coalesce((scored ->> 'ovrExact')::float8, ovr) desc, login),
      score_version
    from players
    where not exists (select 1 from players where score_version <> ${SCORE_VERSION})
  `
  return result.count
}

/**
 * The dream team a verified account picked, in slot order. Only verified accounts count, the same rule as
 * every other profile field; an unclaimed card or an unverified account has none.
 */
export async function getDreamTeamLogins(login: string): Promise<string[]> {
  const sql = getDb()
  const rows = z.array(z.object({ player_login: z.string() })).parse(
    await sql`
        select d.player_login
        from players p
        join accounts a on a.github_id = p.github_id
        join dream_team_picks d on d.github_id = a.github_id
        where p.login = ${keyOf(login)} and a.eligible
        order by d.slot
      `
  )
  return rows.map((row) => row.player_login)
}

const seasonFactsSchema = z.object({
  calendar: z.array(z.object({ date: z.string(), count: z.number() })),
  yearly: z.array(z.object({ year: z.number(), total: z.number(), reviews: z.number().optional() }))
})

/**
 * The two raw fields the season page needs, read without the rest of the ~70 KB facts. Null when the
 * player isn't stored or the stored record has another shape.
 */
export async function getSeasonFacts(
  login: string
): Promise<z.infer<typeof seasonFactsSchema> | null> {
  const sql = getDb()
  const rows = z.array(z.object({ calendar: z.unknown(), yearly: z.unknown() })).parse(
    await sql`
      select facts -> 'calendar' as calendar, facts -> 'yearly' as yearly
      from players
      where login = ${keyOf(login)}
    `
  )
  const row = rows[0]
  if (!row) return null
  const parsed = seasonFactsSchema.safeParse(row)
  return parsed.success ? parsed.data : null
}

/* ---------- Frozen seasons ---------- */

const frozenSeasonSchema = z.object({
  format: z.literal(1),
  login: z.string(),
  githubId: z.number(),
  year: z.number(),
  counts: z.array(z.number()),
  total: z.number(),
  reviews: z.number(),
  yearly: z.array(
    z.object({ year: z.number(), total: z.number(), reviews: z.number().optional() })
  ),
  card: listPlayerSchema
}) satisfies z.ZodType<FrozenSeason>

/**
 * The player's frozen season, matched by GitHub account id so a login that changed hands doesn't show
 * someone else's year. Cards stored before the id was kept fall back to the login.
 */
export async function getFrozenSeason(login: string, year: number): Promise<FrozenSeason | null> {
  const sql = getDb()
  const rows = z.array(z.object({ data: z.unknown() })).parse(
    await sql`
      select s.data
      from players p
      join seasons s on s.year = ${year}
        and (s.github_id = p.github_id or (p.github_id is null and s.login = p.login))
      where p.login = ${keyOf(login)}
      order by s.frozen_at desc
      limit 1
    `
  )
  const row = rows[0]
  if (!row) return null
  const parsed = frozenSeasonSchema.safeParse(row.data)
  if (!parsed.success) {
    console.error("[db] unreadable frozen season", login, year)
    return null
  }
  return parsed.data
}

/** What freezing takes from the stored card: the yearly totals and the card as it stands. */
export async function getFreezeInputs(
  login: string,
  db: "app" | "refresh"
): Promise<{ login: string; yearly: FrozenSeason["yearly"]; scored: ScoredPlayer } | null> {
  const sql = db === "app" ? getDb() : getRefreshDb()
  const rows = z
    .array(
      z.object({
        login: z.string(),
        yearly: z.unknown(),
        scored: scoredPlayerSchema,
        claimed_country: z.string().nullable()
      })
    )
    .parse(
      await sql`
        select login, facts -> 'yearly' as yearly, scored, country as claimed_country
        from players
        where login = ${keyOf(login)}
      `
    )
  const row = rows[0]
  if (!row) return null
  const yearly = frozenSeasonSchema.shape.yearly.safeParse(row.yearly)
  return {
    login: row.login,
    yearly: yearly.success ? yearly.data : [],
    scored: {
      ...row.scored,
      claimedCountry: COUNTRIES.find((code) => code === row.claimed_country)
    }
  }
}

/** Writes a closed season once; a second write for the same account and year is ignored. */
export async function insertFrozenSeason(row: FrozenSeason, db: "app" | "refresh"): Promise<void> {
  const data = frozenSeasonSchema.parse(row)
  const sql = db === "app" ? getDb() : getRefreshDb()
  await sql`
    insert into seasons (github_id, year, login, format, data)
    values (${data.githubId}, ${data.year}, ${keyOf(data.login)}, ${data.format}, ${sql.json(data)})
    on conflict (github_id, year) do nothing
  `
}

/** Players whose season `year` isn't frozen yet, in random order. */
export async function getUnfrozenLogins(year: number, limit: number): Promise<string[]> {
  const sql = getRefreshDb()
  const rows = z.array(z.object({ login: z.string() })).parse(
    await sql`
      select p.login from players p
      where not exists (
        select 1 from seasons s
        where s.year = ${year}
          and (s.github_id = p.github_id or (p.github_id is null and s.login = p.login))
      )
      -- Random order: an account that keeps failing can't hold the front of the queue.
      order by random()
      limit ${limit}
    `
  )
  return rows.map((row) => row.login)
}

/** Years with a frozen season for the player, newest first; the profile links each one. */
export async function getFrozenSeasonYears(login: string): Promise<number[]> {
  const sql = getDb()
  const rows = z.array(z.object({ year: z.number() })).parse(
    await sql`
      select s.year
      from players p
      join seasons s on s.github_id = p.github_id or (p.github_id is null and s.login = p.login)
      where p.login = ${keyOf(login)}
      order by s.year desc
    `
  )
  return rows.map((row) => row.year)
}
