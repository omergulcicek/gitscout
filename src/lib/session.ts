import { createHash, randomBytes } from "node:crypto"

import { serializeCookieHeader } from "@supabase/ssr"
import { z } from "zod"

import { CARD_FACES, GENDERS, SESSION } from "@/constants/account.constants"
import type { CardFace, Gender } from "@/constants/account.constants"
import { TEAMS } from "@/constants/team.constants"
import type { Team } from "@/constants/team.constants"

import { getDb } from "@/lib/db"

/**
 * Uygulamanın kendi oturumu. Tarayıcıda yalnızca httpOnly çerezde 32 baytlık rastgele bir anahtar durur;
 * veritabanında anahtarın kendisi değil SHA-256 özeti tutulur, böylece tablo sızsa bile oturum çalınamaz.
 * Yalnızca sunucu kodu içe aktarır.
 */

/** Giriş yapmış kişi; yalnızca sunucuda yetki kontrolü için kullanılır. */
export type Viewer = {
  githubId: number
  login: string
  avatarUrl: string
  eligible: boolean
  country: string | null
  /** İlk kez onaylı sayıldığı an (ISO); onaylı değilse `null`. */
  verifiedAt: string | null
  /** Beyan edilen doğum tarihi (YYYY-AA-GG); yalnızca kişinin kendisine gösterilir. */
  birthDate: string | null
  /** Doğum tarihini kaç kez daha kaydedebileceği (ilk kayıt ve bir düzeltme). */
  birthDateChangesLeft: number
  /** Beyan edilen şehir; yalnızca kişinin kendisine gösterilir. */
  city: string | null
  /** Beyan edilen cinsiyet; yalnızca kişinin kendisine gösterilir. */
  gender: Gender | null
  /** Rüya takımındaki oyuncuların kullanıcı adları, seçtiği sırayla (en fazla beş). */
  dreamTeam: string[]
  /** Favori takım; yalnızca kişinin kendisine gösterilir. */
  favoriteTeam: Team | null
  /** Profilde varsayılan kart yüzü; boşsa gerçek kart. */
  cardFace: CardFace | null
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/
const MAX_AGE_SECONDS = SESSION.maxAgeDays * 24 * 60 * 60

const hashToken = (token: string) => createHash("sha256").update(token).digest()

const cookieOptions = (maxAge: number) => ({
  path: "/",
  httpOnly: true,
  secure: !import.meta.env.DEV,
  sameSite: "lax" as const,
  maxAge
})

/** Oturum çerezi için `setCookie` / `Set-Cookie` seçenekleri. */
export const sessionCookie = {
  name: SESSION.cookieName,
  options: cookieOptions(MAX_AGE_SECONDS),
  serialize: (token: string) =>
    serializeCookieHeader(SESSION.cookieName, token, cookieOptions(MAX_AGE_SECONDS)),
  serializeRemoval: (name: string = SESSION.cookieName) =>
    serializeCookieHeader(name, "", cookieOptions(0))
}

/** Yeni oturum açar ve tarayıcıya yazılacak anahtarı döner. Hesabın süresi dolmuş oturumları da temizlenir. */
export async function createSession(githubId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url")
  const sql = getDb()
  await sql`delete from sessions where github_id = ${githubId} and expires_at < now()`
  await sql`
    insert into sessions (token_hash, github_id, expires_at)
    values (${hashToken(token)}, ${githubId}, now() + make_interval(secs => ${MAX_AGE_SECONDS}))
  `
  return token
}

const viewerRowSchema = z.object({
  github_id: z.coerce.number(),
  login: z.string(),
  avatar_url: z.string(),
  eligible: z.boolean(),
  country: z.string().nullable(),
  verified_at: z.date().nullable(),
  birth_date: z.string().nullable(),
  birth_date_changes: z.number(),
  city: z.string().nullable(),
  // Tanınmayan değer boş sayılır; sütunun kendi kısıtı zaten yalnızca bu ikisine izin verir.
  gender: z.enum(GENDERS).nullable().catch(null),
  dream_team: z.array(z.string()),
  favorite_team: z.enum(TEAMS).nullable().catch(null),
  card_face: z.enum(CARD_FACES).nullable().catch(null)
})

/** Anahtarın oturumu geçerliyse kişiyi döner. Kullanıcı adı başka bir hesaba geçtiyse oturum sayılmaz. */
export async function findViewer(token: string | undefined): Promise<Viewer | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null
  const sql = getDb()
  const [row] = z.array(viewerRowSchema).parse(
    await sql`
      select a.github_id, a.login, a.avatar_url, a.eligible,
        (select p.country from players p where p.github_id = a.github_id limit 1) as country, a.verified_at,
        to_char(a.birth_date, 'YYYY-MM-DD') as birth_date, a.birth_date_changes, a.city, a.gender,
        a.favorite_team, a.card_face,
        coalesce(
          (select array_agg(d.player_login order by d.slot) from dream_team_picks d where d.github_id = a.github_id),
          '{}'
        ) as dream_team
      from sessions s
      join accounts a on a.github_id = s.github_id
      where s.token_hash = ${hashToken(token)} and s.expires_at > now() and a.login is not null
    `
  )
  if (!row) return null
  return {
    githubId: row.github_id,
    login: row.login,
    avatarUrl: row.avatar_url,
    eligible: row.eligible,
    country: row.country,
    verifiedAt: row.verified_at?.toISOString() ?? null,
    birthDate: row.birth_date,
    birthDateChangesLeft: Math.max(0, 2 - row.birth_date_changes),
    city: row.city,
    gender: row.gender,
    dreamTeam: row.dream_team,
    favoriteTeam: row.favorite_team,
    cardFace: row.card_face
  }
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token || !TOKEN_PATTERN.test(token)) return
  const sql = getDb()
  await sql`delete from sessions where token_hash = ${hashToken(token)}`
}
