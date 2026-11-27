import { z } from "zod"

import type { ListPlayer, ScoredPlayer, StoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** GitHub kullanıcı adı kuralları: harf, rakam ve tek tire; en fazla 39 karakter. */
export const usernameSchema = z
  .string()
  .trim()
  // Mesajlar fonksiyon: okunduğu anda (doğrulama sırasında) geçerli dilde yazılır.
  .min(1, { error: () => m.username_required() })
  .max(39, { error: () => m.username_too_long() })
  .regex(/^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d]))*$/, { error: () => m.username_invalid() })

export const addPlayerSchema = z.object({
  username: usernameSchema
})

export type AddPlayerInput = z.infer<typeof addPlayerSchema>

const checkState = z.enum(["SUCCESS", "FAILURE", "ERROR", "PENDING", "EXPECTED"])

const playerFactsSchema = z.object({
  login: z.string(),
  /**
   * GitHub's numeric account id. Accounts are linked to cards by it, so a login that changes hands can't
   * inherit the old owner's account. Missing on cards fetched before it was stored.
   */
  githubId: z.number().optional(),
  name: z.string().nullable(),
  avatarUrl: z.string(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  /** GitHub profilindeki serbest metin konum; eski kayıtlarda yok. */
  location: z.string().nullable().optional(),
  followers: z.number(),
  createdAt: z.string(),
  topOrg: z.string().nullable(),
  mergedExternalPrs: z.number(),
  utcOffsetMinutes: z.number().nullable().optional(),
  lastYear: z.object({
    commits: z.number(),
    prs: z.number(),
    reviews: z.number(),
    issues: z.number(),
    restricted: z.number()
  }),
  ownedRepos: z.array(
    z.object({
      name: z.string(),
      isArchived: z.boolean(),
      pushedAt: z.string(),
      stars: z.number(),
      forks: z.number(),
      hasDescription: z.boolean(),
      hasHomepage: z.boolean(),
      topicCount: z.number(),
      license: z.string().nullable(),
      readmeBytes: z.number(),
      languages: z.array(z.object({ name: z.string(), size: z.number() }))
    })
  ),
  activeRepos: z.array(
    z.object({
      nameWithOwner: z.string(),
      isOrg: z.boolean(),
      stars: z.number(),
      forks: z.number(),
      languages: z.array(z.object({ name: z.string(), size: z.number() })),
      yearCommits: z.number(),
      userYearCommits: z.number(),
      allCommits: z.number().optional(),
      userAllCommits: z.number().optional(),
      agentYearCommits: z.number().optional(),
      agentAllCommits: z.number().optional(),
      hasTests: z.boolean(),
      hasCi: z.boolean(),
      checkStates: z.array(checkState),
      userCommitsLastYear: z.number()
    })
  ),
  commits: z.array(
    z.object({
      repo: z.string(),
      sha: z.string().default(""),
      isMerge: z.boolean().default(false),
      message: z.string(),
      date: z.string(),
      changedFiles: z.number().nullable()
    })
  ),
  calendar: z.array(z.object({ date: z.string(), count: z.number() })),
  yearly: z.array(
    z.object({ year: z.number(), total: z.number(), reviews: z.number().optional() })
  ),
  starredRepos: z
    .array(
      z.object({
        name: z.string(),
        stars: z.number(),
        forks: z.number(),
        language: z.string().nullable()
      })
    )
    .optional(),
  repoCommits: z
    .array(z.object({ repo: z.string(), commits: z.number(), stars: z.number() }))
    .optional(),
  ownOrgPrs: z.array(z.object({ org: z.string(), prs: z.number() })).optional()
})

export const storedPlayerSchema: z.ZodType<StoredPlayer> = z.object({
  login: z.string(),
  fetchedAt: z.string(),
  timezone: z.string().optional(),
  facts: playerFactsSchema
})

/**
 * Veritabanındaki puan özeti sunucunun kendi yazdığı veridir ve sürümüyle birlikte okunur;
 * alanların tamamı yerine temel biçim doğrulanır.
 */
/** Listelerin hafif özeti; SQL'de tam özetten türetilir, aynı temel biçim doğrulanır. */
export const listPlayerSchema = z.custom<ListPlayer>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "login" in value &&
    typeof value.login === "string" &&
    "ovrExact" in value &&
    typeof value.ovrExact === "number" &&
    "stats" in value &&
    typeof value.stats === "object"
)

export const scoredPlayerSchema = z.custom<ScoredPlayer>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "login" in value &&
    typeof value.login === "string" &&
    "ovr" in value &&
    typeof value.ovr === "number" &&
    "stats" in value &&
    typeof value.stats === "object"
)
