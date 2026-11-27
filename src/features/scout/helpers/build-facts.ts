import { ACTIVE_REPOS } from "@/features/scout/constants/scoring.constants"
import { detectCi, detectTests } from "@/features/scout/helpers/detect-tests"
import type { ActiveRepoNode, ProfileResponse } from "@/features/scout/schemas/github.schema"
import type {
  ActiveRepo,
  CheckState,
  CommitSample,
  OrgPrCount,
  OwnedRepo,
  PlayerFacts,
  StarredRepo
} from "@/features/scout/types/player.types"

type ProfileUser = NonNullable<ProfileResponse["user"]>

export type ActiveRepoRef = {
  owner: string
  name: string
  nameWithOwner: string
  userCommitsLastYear: number
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000
const MERGE_COMMIT = /^Merge (pull request|branch|remote-tracking branch)/
const CHECK_STATES: readonly CheckState[] = ["SUCCESS", "FAILURE", "ERROR", "PENDING", "EXPECTED"]

function isCheckState(value: string): value is CheckState {
  return CHECK_STATES.some((state) => state === value)
}

/** Token private repolara erişebilse de skora yalnızca herkese açık katkılar girer. */
function publicContributions(user: ProfileUser) {
  return user.contributionsCollection.commitContributionsByRepository.filter(
    (item) => !item.repository.isPrivate
  )
}

/** Profil README'si ve .github gibi kod içermeyen özel repolar skorlara girmez. */
function isSpecialRepo(name: string, login: string) {
  const lower = name.toLowerCase()
  return lower === login.toLowerCase() || lower === ".github"
}

/** Son bir yılda üzerinde çalışılan repoları seçer: aktif kendi repoları ve yeterince katkı verilen diğerleri. */
export function pickActiveRepos(user: ProfileUser, now: Date): ActiveRepoRef[] {
  const commitsByRepo = new Map<string, number>()
  for (const item of publicContributions(user)) {
    commitsByRepo.set(item.repository.nameWithOwner, item.contributions.totalCount)
  }

  const refs = new Map<string, ActiveRepoRef>()

  for (const repo of user.repositories.nodes) {
    if (repo.isArchived || isSpecialRepo(repo.name, user.login)) continue
    if ((repo.languages?.edges.length ?? 0) === 0 || !repo.pushedAt) continue
    if (now.getTime() - new Date(repo.pushedAt).getTime() > YEAR_MS) continue
    const nameWithOwner = `${user.login}/${repo.name}`
    refs.set(nameWithOwner, {
      owner: user.login,
      name: repo.name,
      nameWithOwner,
      userCommitsLastYear: commitsByRepo.get(nameWithOwner) ?? 0
    })
  }

  for (const item of publicContributions(user)) {
    const { repository, contributions } = item
    if (repository.isFork || refs.has(repository.nameWithOwner)) continue
    if (repository.owner.login.toLowerCase() === user.login.toLowerCase()) continue
    if (contributions.totalCount < ACTIVE_REPOS.contributedMinCommits) continue
    const [, name = ""] = repository.nameWithOwner.split("/")
    refs.set(repository.nameWithOwner, {
      owner: repository.owner.login,
      name,
      nameWithOwner: repository.nameWithOwner,
      userCommitsLastYear: contributions.totalCount
    })
  }

  return [...refs.values()]
    .sort((a, b) => b.userCommitsLastYear - a.userCommitsLastYear)
    .slice(0, ACTIVE_REPOS.max)
}

function toOwnedRepo(repo: ProfileUser["repositories"]["nodes"][number]): OwnedRepo {
  return {
    name: repo.name,
    isArchived: repo.isArchived,
    pushedAt: repo.pushedAt ?? new Date(0).toISOString(),
    stars: repo.stargazerCount,
    forks: repo.forkCount,
    hasDescription: Boolean(repo.description?.trim()),
    hasHomepage: Boolean(repo.homepageUrl?.trim()),
    topicCount: repo.repositoryTopics.totalCount,
    license: repo.licenseInfo?.spdxId ?? null,
    readmeBytes: Math.max(repo.readmeUpper?.byteSize ?? 0, repo.readmeLower?.byteSize ?? 0),
    languages: (repo.languages?.edges ?? []).map((edge) => ({
      name: edge.node.name,
      size: edge.size
    }))
  }
}

function topOrganization(user: ProfileUser): string | null {
  const totals = new Map<string, number>()
  for (const item of publicContributions(user)) {
    if (item.repository.owner.__typename !== "Organization") continue
    const owner = item.repository.owner.login
    totals.set(owner, (totals.get(owner) ?? 0) + item.contributions.totalCount)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [owner, count] of totals) {
    if (count > bestCount) {
      best = owner
      bestCount = count
    }
  }
  return best
}

type BuildFactsInput = {
  user: ProfileUser
  mergedExternalPrs: number
  activeRefs: ActiveRepoRef[]
  activeNodes: Record<string, ActiveRepoNode>
  yearly: { year: number; total: number; reviews: number }[]
  starredRepos: StarredRepo[]
  ownOrgPrs: OrgPrCount[]
  commitSampleSize: number
}

/** GraphQL yanıtlarını, skorlamanın kullandığı sade gerçeklere çevirir. */
export function buildFacts(input: BuildFactsInput): PlayerFacts {
  const { user, activeRefs, activeNodes } = input

  const activeRepos: ActiveRepo[] = []
  const commits: CommitSample[] = []

  activeRefs.forEach((ref, index) => {
    const node = activeNodes[`r${index}`]
    if (!node) return
    const target = node.defaultBranchRef?.target ?? null
    const rootEntries = node.root?.entries.map((entry) => entry.name) ?? []
    const workflowEntries = node.workflows?.entries.map((entry) => entry.name) ?? []

    activeRepos.push({
      nameWithOwner: node.nameWithOwner,
      isOrg: node.owner.__typename === "Organization",
      stars: node.stargazerCount,
      forks: node.forkCount,
      languages: (node.languages?.edges ?? []).map((edge) => ({
        name: edge.node.name,
        size: edge.size
      })),
      yearCommits: target?.yearTotal.totalCount ?? 0,
      userYearCommits: target?.mineYear.totalCount ?? 0,
      allCommits: target?.allTotal.totalCount ?? 0,
      userAllCommits: target?.mineAll.totalCount ?? 0,
      agentYearCommits: target?.agentsYear.totalCount ?? 0,
      agentAllCommits: target?.agentsAll.totalCount ?? 0,
      hasTests: detectTests(node.pkg?.text ?? null, rootEntries),
      hasCi: detectCi(workflowEntries),
      checkStates: (target?.checks.nodes ?? [])
        .map((commit) => commit.statusCheckRollup?.state ?? null)
        .filter((state): state is string => state !== null)
        .filter(isCheckState),
      userCommitsLastYear: ref.userCommitsLastYear
    })

    for (const commit of target?.mine.nodes ?? []) {
      if (MERGE_COMMIT.test(commit.messageHeadline)) continue
      // GitHub'ın yazar filtresi oyuncunun birleştirdiği başkalarının commit'lerini de döndürebiliyor.
      const authorLogin = commit.author?.user?.login
      if (authorLogin?.toLowerCase() !== user.login.toLowerCase()) continue
      commits.push({
        repo: node.nameWithOwner,
        sha: commit.oid,
        isMerge: commit.parents.totalCount > 1,
        message: commit.messageHeadline,
        date: commit.committedDate,
        changedFiles: commit.changedFilesIfAvailable
      })
    }
  })

  commits.sort((a, b) => b.date.localeCompare(a.date))

  return {
    login: user.login,
    githubId: user.databaseId,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    company: user.company,
    location: user.location,
    followers: user.followers.totalCount,
    createdAt: user.createdAt,
    topOrg: topOrganization(user),
    mergedExternalPrs: input.mergedExternalPrs,
    lastYear: {
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      reviews: user.contributionsCollection.totalPullRequestReviewContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      restricted: user.contributionsCollection.restrictedContributionsCount
    },
    ownedRepos: user.repositories.nodes
      .filter((repo) => !isSpecialRepo(repo.name, user.login))
      .map(toOwnedRepo),
    activeRepos,
    commits: commits.slice(0, input.commitSampleSize),
    calendar: user.contributionsCollection.contributionCalendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))
    ),
    yearly: input.yearly,
    starredRepos: input.starredRepos.filter((repo) => !isSpecialRepo(repo.name, user.login)),
    repoCommits: publicContributions(user).map((item) => ({
      repo: item.repository.nameWithOwner,
      commits: item.contributions.totalCount,
      stars: item.repository.stargazerCount
    })),
    ownOrgPrs: input.ownOrgPrs
  }
}
