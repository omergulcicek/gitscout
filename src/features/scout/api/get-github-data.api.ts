import type { z } from "zod"

import { ApiError } from "@/lib/api"
import { githubApi, hasGithubToken } from "@/lib/github"

import { AGENT_COMMIT_EMAILS } from "@/features/scout/constants/agent-commits.constants"
import {
  activeResponseSchema,
  graphqlEnvelopeSchema,
  patchSchema,
  profileBaseSchema,
  reposPageSchema,
  searchCountsSchema,
  starredPageSchema,
  yearlyResponseSchema
} from "@/features/scout/schemas/github.schema"
import type { ProfileResponse } from "@/features/scout/schemas/github.schema"

/** Büyük profillerde GraphQL yanıtı birkaç saniyeyi bulabiliyor. */
const GRAPHQL_TIMEOUT_MS = 45_000

export class GithubError extends Error {
  constructor(
    message: string,
    readonly kind: "missing-token" | "not-found" | "rate-limit" | "request",
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = "GithubError"
  }
}

function toGithubError(error: unknown): GithubError {
  // Sunucu logunda gerçek nedeni görmek için; ApiError token ya da header içermez.
  console.error(
    "[github]",
    error instanceof ApiError ? { kind: error.kind, status: error.status, data: error.data } : error
  )
  if (error instanceof ApiError && error.kind === "http") {
    if (error.status === 401) {
      return new GithubError("GITHUB_TOKEN geçersiz", "missing-token", { cause: error })
    }
    if (error.status === 403 || error.status === 429) {
      return new GithubError("GitHub istek limiti doldu, biraz sonra tekrar dene", "rate-limit", {
        cause: error
      })
    }
  }
  return new GithubError("GitHub'a ulaşılamadı", "request", { cause: error })
}

/** GitHub ara sıra 502 ya da boş gövde döndürüyor; bunlar kalıcı hata değil. */
const MAX_RETRIES = 2

function isTransient(error: unknown) {
  if (!(error instanceof ApiError)) return false
  if (error.kind === "network" || error.kind === "timeout" || error.kind === "parse") return true
  return error.status !== null && error.status >= 500
}

async function postWithRetry(query: string, variables: Record<string, unknown>) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await githubApi.post(
        "/graphql",
        { query, variables },
        { schema: graphqlEnvelopeSchema, timeoutMs: GRAPHQL_TIMEOUT_MS }
      )
    } catch (error) {
      if (attempt >= MAX_RETRIES || !isTransient(error)) throw toGithubError(error)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
}

async function graphql<T extends z.ZodType>(
  query: string,
  variables: Record<string, unknown>,
  schema: T
): Promise<z.output<T>> {
  if (!hasGithubToken()) {
    throw new GithubError(".env.local içinde GITHUB_TOKEN tanımlı değil", "missing-token")
  }

  const envelope = await postWithRetry(query, variables)

  const notFound = envelope.errors?.some((error) => error.type === "NOT_FOUND")
  if (notFound && envelope.data == null) {
    throw new GithubError("Bu kullanıcı adıyla bir GitHub hesabı bulunamadı", "not-found")
  }
  // Kısmi hatalar (erişilemeyen tek bir repo gibi) veriyi bozmuyorsa devam edilir.
  if (envelope.data == null) {
    const message = envelope.errors?.map((error) => error.message).join("; ") ?? "Boş yanıt"
    throw new GithubError(`GitHub sorgusu başarısız: ${message}`, "request")
  }

  const parsed = schema.safeParse(envelope.data)
  if (!parsed.success) {
    throw new GithubError("GitHub yanıtı beklenen biçimde değil", "request", {
      cause: parsed.error
    })
  }
  return parsed.data
}

const PROFILE_QUERY = /* GraphQL */ `
  query Profile($login: String!, $prQuery: String!) {
    user(login: $login) {
      id
      databaseId
      login
      name
      bio
      company
      location
      avatarUrl
      createdAt
      followers {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        restrictedContributionsCount
        contributionCalendar {
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 50) {
          contributions {
            totalCount
          }
          repository {
            nameWithOwner
            isFork
            isPrivate
            stargazerCount
            owner {
              login
              __typename
            }
          }
        }
      }
    }
    mergedPrs: search(query: $prQuery, type: ISSUE) {
      issueCount
    }
  }
`

const REPOS_QUERY = /* GraphQL */ `
  query Repos($login: String!, $after: String, $pageSize: Int!) {
    user(login: $login) {
      repositories(
        first: $pageSize
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          isArchived
          pushedAt
          stargazerCount
          forkCount
          description
          homepageUrl
          repositoryTopics(first: 1) {
            totalCount
          }
          licenseInfo {
            spdxId
          }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
          readmeUpper: object(expression: "HEAD:README.md") {
            ... on Blob {
              byteSize
            }
          }
          readmeLower: object(expression: "HEAD:readme.md") {
            ... on Blob {
              byteSize
            }
          }
        }
      }
    }
  }
`

/** README kontrolü repo başına pahalı; 100 repo tek istekte GitHub'ın süre sınırını aşıyor. */
const REPOS_PAGE_SIZE = 25
const MAX_REPO_PAGES = 4

async function fetchOwnedRepos(login: string) {
  const nodes: z.output<typeof reposPageSchema>["user"]["repositories"]["nodes"] = []
  let after: string | null = null
  for (let page = 0; page < MAX_REPO_PAGES; page += 1) {
    const result: z.output<typeof reposPageSchema> = await graphql(
      REPOS_QUERY,
      { login, after, pageSize: REPOS_PAGE_SIZE },
      reposPageSchema
    )
    const { repositories } = result.user
    nodes.push(...repositories.nodes)
    if (!repositories.pageInfo.hasNextPage) break
    after = repositories.pageInfo.endCursor
  }
  return nodes
}

const STARRED_QUERY = /* GraphQL */ `
  query Starred($login: String!) {
    user(login: $login) {
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          stargazerCount
          forkCount
          primaryLanguage {
            name
          }
        }
      }
    }
  }
`

/**
 * En çok yıldızlı 100 repo. Ayrıntılı repo listesi son push tarihine göre 100 repoda kesildiği için
 * eski ama popüler repolar orada görünmeyebiliyor; bu sorgu hafif olduğu için tek istekte gelir.
 */
export async function fetchStarredRepos(login: string) {
  const result = await graphql(STARRED_QUERY, { login }, starredPageSchema)
  return result.user.repositories.nodes
}

/** Organizasyon başına, kullanıcının o organizasyonda birleştirilen herkese açık PR sayısı. */
export async function fetchOrgPrCounts(login: string, orgs: string[]) {
  if (orgs.length === 0) return []
  const fields = orgs
    .map(
      (org, index) =>
        `o${index}: search(query: ${JSON.stringify(`author:${login} is:pr is:merged is:public org:${org}`)}, type: ISSUE) { issueCount }`
    )
    .join("\n")
  const result = await graphql(`query OrgPrs {\n${fields}\n}`, {}, searchCountsSchema)
  return orgs.map((org, index) => ({ org, prs: result[`o${index}`]?.issueCount ?? 0 }))
}

export async function fetchProfile(login: string): Promise<ProfileResponse> {
  const profile = await graphql(
    PROFILE_QUERY,
    { login, prQuery: `author:${login} is:pr is:merged is:public -user:${login}` },
    profileBaseSchema
  )
  if (!profile.user) return { ...profile, user: null }
  const repositories = await fetchOwnedRepos(login)
  return { ...profile, user: { ...profile.user, repositories: { nodes: repositories } } }
}

const ACTIVE_REPO_FIELDS = /* GraphQL */ `
  fragment ActiveRepo on Repository {
    nameWithOwner
    stargazerCount
    forkCount
    owner {
      __typename
    }
    languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
      edges {
        size
        node {
          name
        }
      }
    }
    root: object(expression: "HEAD:") {
      ... on Tree {
        entries {
          name
        }
      }
    }
    workflows: object(expression: "HEAD:.github/workflows") {
      ... on Tree {
        entries {
          name
        }
      }
    }
    pkg: object(expression: "HEAD:package.json") {
      ... on Blob {
        text
      }
    }
    defaultBranchRef {
      target {
        ... on Commit {
          yearTotal: history(since: $since) {
            totalCount
          }
          mineYear: history(since: $since, author: { id: $userId }) {
            totalCount
          }
          allTotal: history {
            totalCount
          }
          mineAll: history(author: { id: $userId }) {
            totalCount
          }
          agentsYear: history(since: $since, author: { emails: $agentEmails }) {
            totalCount
          }
          agentsAll: history(author: { emails: $agentEmails }) {
            totalCount
          }
          checks: history(first: 10) {
            nodes {
              statusCheckRollup {
                state
              }
            }
          }
          mine: history(first: 50, author: { id: $userId }) {
            nodes {
              oid
              messageHeadline
              committedDate
              changedFilesIfAvailable
              parents(first: 2) {
                totalCount
              }
              author {
                user {
                  login
                }
              }
            }
          }
        }
      }
    }
  }
`

/** GitHub GraphQL ~10 saniyede kesiyor; ağır repo alanları küçük parçalar halinde istenir. */
const ACTIVE_CHUNK_SIZE = 4
const ACTIVE_CONCURRENCY = 2

/** Aktif repoların test, CI ve commit verisini alias'larla çeker. Alias'lar `r{index}` olarak global sırayı korur. */
export async function fetchActiveRepos(
  userId: string,
  repos: { owner: string; name: string }[],
  since: string
): Promise<z.output<typeof activeResponseSchema>> {
  const chunks: { index: number; owner: string; name: string }[][] = []
  repos.forEach((repo, index) => {
    const chunkIndex = Math.floor(index / ACTIVE_CHUNK_SIZE)
    chunks[chunkIndex] = [...(chunks[chunkIndex] ?? []), { index, ...repo }]
  })

  const fetchChunk = (chunk: { index: number; owner: string; name: string }[]) => {
    const fields = chunk
      .map(
        (repo) =>
          `r${repo.index}: repository(owner: ${JSON.stringify(repo.owner)}, name: ${JSON.stringify(repo.name)}) { ...ActiveRepo }`
      )
      .join("\n")
    const query = `query Active($userId: ID!, $since: GitTimestamp!, $agentEmails: [String!]) {\n${fields}\n}\n${ACTIVE_REPO_FIELDS}`
    return graphql(query, { userId, since, agentEmails: AGENT_COMMIT_EMAILS }, activeResponseSchema)
  }

  // Çok büyük bir repo parçayı zaman aşımına düşürürse repolar tek tek denenir;
  // yine düşen repo skordan çıkar ama kartın tamamı başarısız olmaz.
  const fetchChunkSafely = async (chunk: { index: number; owner: string; name: string }[]) => {
    try {
      return await fetchChunk(chunk)
    } catch (error) {
      if (!(error instanceof GithubError) || error.kind !== "request") throw error
      const singles = await Promise.all(
        chunk.map((repo) =>
          fetchChunk([repo]).catch((singleError: unknown) => {
            if (singleError instanceof GithubError && singleError.kind === "request") {
              console.error(`[github] ${repo.owner}/${repo.name} atlandı`, singleError.message)
              return {}
            }
            throw singleError
          })
        )
      )
      return Object.assign({}, ...singles)
    }
  }

  const result: z.output<typeof activeResponseSchema> = {}
  for (let start = 0; start < chunks.length; start += ACTIVE_CONCURRENCY) {
    const batch = await Promise.all(
      chunks.slice(start, start + ACTIVE_CONCURRENCY).map(fetchChunkSafely)
    )
    for (const part of batch) Object.assign(result, part)
  }
  return result
}

/** Bir sorgudaki yıl sayısı; yoğun hesaplarda yıl başına ~3 saniye sürüyor, GitHub ~10 saniyede kesiyor. */
const YEARS_PER_QUERY = 2
const YEARLY_CONCURRENCY = 3

/** Takvim yılı başına toplam katkı ve review; GitHub bir sorguda en fazla bir yıllık aralık kabul ediyor. */
export async function fetchYearlyContributions(login: string, years: number[]) {
  const fetchYears = (chunk: number[]) => {
    const fields = chunk
      .map(
        (year) =>
          `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") { totalPullRequestReviewContributions contributionCalendar { totalContributions } }`
      )
      .join("\n")
    const query = `query Yearly($login: String!) { user(login: $login) {\n${fields}\n} }`
    return graphql(query, { login }, yearlyResponseSchema)
  }

  // Parça zaman aşımına düşerse yıllar tek tek istenir.
  const fetchSafely = async (chunk: number[]) => {
    try {
      return await fetchYears(chunk)
    } catch (error) {
      if (!(error instanceof GithubError) || error.kind !== "request" || chunk.length === 1) {
        throw error
      }
      const singles = await Promise.all(chunk.map((year) => fetchYears([year])))
      return { user: Object.assign({}, ...singles.map((single) => single.user)) }
    }
  }

  const chunks: number[][] = []
  for (let start = 0; start < years.length; start += YEARS_PER_QUERY) {
    chunks.push(years.slice(start, start + YEARS_PER_QUERY))
  }
  const user: z.output<typeof yearlyResponseSchema>["user"] = {}
  for (let start = 0; start < chunks.length; start += YEARLY_CONCURRENCY) {
    const batch = await Promise.all(
      chunks.slice(start, start + YEARLY_CONCURRENCY).map(fetchSafely)
    )
    for (const result of batch) Object.assign(user, result.user)
  }
  return { user }
}

const PATCH_DATE = /^Date: .* ([+-])(\d{2})(\d{2})$/m

/**
 * GraphQL commit saatlerini UTC verir; yazarın yerel saat farkı yalnızca commit'in patch
 * hâlindeki Date satırında durur. Dakika cinsinden fark döner, bulunamazsa null.
 */
export async function fetchCommitUtcOffset(repo: string, sha: string): Promise<number | null> {
  try {
    const patch = await githubApi.get(`/repos/${repo}/commits/${sha}`, {
      headers: { Accept: "application/vnd.github.patch" },
      schema: patchSchema
    })
    const match = PATCH_DATE.exec(patch)
    if (!match) return null
    const [, sign, hours = "0", minutes = "0"] = match
    const offset = Number(hours) * 60 + Number(minutes)
    return sign === "-" ? -offset : offset
  } catch (error) {
    // Saat farkı yalnızca rozetler için; bulunamazsa kart yine çıkar.
    console.error(
      "[github] saat farkı okunamadı",
      repo,
      sha,
      error instanceof Error ? error.message : error
    )
    return null
  }
}
