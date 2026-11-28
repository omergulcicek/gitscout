import { describe, expect, it } from "vitest"

import { ACTIVE_REPOS } from "@/features/scout/constants/scoring.constants"
import { buildFacts, pickActiveRepos } from "@/features/scout/helpers/build-facts"
import type { ActiveRepoNode, ProfileResponse } from "@/features/scout/schemas/github.schema"

type ProfileUser = NonNullable<ProfileResponse["user"]>
type OwnedNode = ProfileUser["repositories"]["nodes"][number]

const NOW = new Date("2026-11-24T12:00:00Z")

function makeOwnedNode(overrides: Partial<OwnedNode> = {}): OwnedNode {
  return {
    name: "app",
    isArchived: false,
    pushedAt: "2026-11-01T00:00:00Z",
    stargazerCount: 10,
    forkCount: 2,
    description: "App description",
    homepageUrl: "https://example.com",
    repositoryTopics: { totalCount: 3 },
    licenseInfo: { spdxId: "MIT" },
    languages: { edges: [{ size: 100, node: { name: "TypeScript" } }] },
    readmeUpper: { byteSize: 500 },
    readmeLower: null,
    ...overrides
  }
}

function makeUser(overrides: Partial<ProfileUser> = {}): ProfileUser {
  return {
    id: "U_1",
    databaseId: 42,
    login: "ada",
    name: "Ada Lovelace",
    bio: "Mathematician",
    company: "@engine",
    location: "London",
    avatarUrl: "https://example.com/ada.png",
    createdAt: "2018-01-01T00:00:00Z",
    followers: { totalCount: 100 },
    repositories: { nodes: [] },
    contributionsCollection: {
      totalCommitContributions: 200,
      totalPullRequestContributions: 15,
      totalPullRequestReviewContributions: 12,
      totalIssueContributions: 5,
      restrictedContributionsCount: 3,
      contributionCalendar: {
        weeks: [
          {
            contributionDays: [
              { date: "2026-11-22", contributionCount: 2 },
              { date: "2026-11-23", contributionCount: 0 }
            ]
          }
        ]
      },
      commitContributionsByRepository: []
    },
    ...overrides
  }
}

function makeActiveNode(
  overrides: Partial<NonNullable<ActiveRepoNode>> = {}
): NonNullable<ActiveRepoNode> {
  return {
    nameWithOwner: "ada/app",
    stargazerCount: 10,
    forkCount: 2,
    owner: { __typename: "User" },
    languages: { edges: [{ size: 100, node: { name: "TypeScript" } }] },
    root: { entries: [{ name: "tests" }] },
    workflows: { entries: [{ name: "ci.yml" }] },
    pkg: null,
    defaultBranchRef: {
      target: {
        yearTotal: { totalCount: 40 },
        mineYear: { totalCount: 20 },
        allTotal: { totalCount: 100 },
        mineAll: { totalCount: 60 },
        agentsYear: { totalCount: 2 },
        agentsAll: { totalCount: 4 },
        checks: {
          nodes: [
            { statusCheckRollup: { state: "SUCCESS" } },
            { statusCheckRollup: { state: "UNKNOWN_STATE" } },
            { statusCheckRollup: null }
          ]
        },
        mine: {
          nodes: [
            {
              oid: "111",
              messageHeadline: "feat: older commit",
              committedDate: "2026-11-20T10:00:00Z",
              changedFilesIfAvailable: 2,
              parents: { totalCount: 1 },
              author: { user: { login: "Ada" } }
            },
            {
              oid: "222",
              messageHeadline: "Merge pull request #5 from ada/feat",
              committedDate: "2026-11-21T10:00:00Z",
              changedFilesIfAvailable: 5,
              parents: { totalCount: 2 },
              author: { user: { login: "ada" } }
            },
            {
              oid: "333",
              messageHeadline: "fix: someone else's commit",
              committedDate: "2026-11-22T10:00:00Z",
              changedFilesIfAvailable: 1,
              parents: { totalCount: 1 },
              author: { user: { login: "other" } }
            },
            {
              oid: "444",
              messageHeadline: "fix: newer commit",
              committedDate: "2026-11-23T10:00:00Z",
              changedFilesIfAvailable: 3,
              parents: { totalCount: 1 },
              author: { user: { login: "ada" } }
            }
          ]
        }
      }
    },
    ...overrides
  }
}

describe("pickActiveRepos", () => {
  it("filters out archived, special, empty-language, and stale owned repos", () => {
    const user = makeUser({
      login: "ada",
      repositories: {
        nodes: [
          makeOwnedNode({ name: "ada" }),
          makeOwnedNode({ name: ".github" }),
          makeOwnedNode({ name: "archived", isArchived: true }),
          makeOwnedNode({ name: "empty-lang", languages: { edges: [] } }),
          makeOwnedNode({ name: "stale", pushedAt: "2025-10-01T00:00:00Z" }),
          makeOwnedNode({ name: "valid", pushedAt: "2026-10-01T00:00:00Z" })
        ]
      }
    })

    const refs = pickActiveRepos(user, NOW)
    expect(refs.map((r) => r.nameWithOwner)).toEqual(["ada/valid"])
  })

  it("includes eligible public org repos, excludes private/fork/low-commit ones, and caps at ACTIVE_REPOS.max", () => {
    const extraOrgs = Array.from({ length: ACTIVE_REPOS.max + 5 }, (_, i) => ({
      contributions: { totalCount: 20 + i },
      repository: {
        nameWithOwner: `org/repo-${i}`,
        isFork: false,
        isPrivate: false,
        stargazerCount: 5,
        owner: { login: "org", __typename: "Organization" }
      }
    }))

    const user = makeUser({
      contributionsCollection: {
        ...makeUser().contributionsCollection,
        commitContributionsByRepository: [
          {
            contributions: { totalCount: 100 },
            repository: {
              nameWithOwner: "secret/private-repo",
              isFork: false,
              isPrivate: true,
              stargazerCount: 0,
              owner: { login: "secret", __typename: "Organization" }
            }
          },
          {
            contributions: { totalCount: 100 },
            repository: {
              nameWithOwner: "other/forked",
              isFork: true,
              isPrivate: false,
              stargazerCount: 0,
              owner: { login: "other", __typename: "User" }
            }
          },
          {
            contributions: { totalCount: ACTIVE_REPOS.contributedMinCommits - 1 },
            repository: {
              nameWithOwner: "other/few-commits",
              isFork: false,
              isPrivate: false,
              stargazerCount: 0,
              owner: { login: "other", __typename: "User" }
            }
          },
          ...extraOrgs
        ]
      }
    })

    const refs = pickActiveRepos(user, NOW)
    expect(refs).toHaveLength(ACTIVE_REPOS.max)
    expect(refs[0]?.nameWithOwner).toBe(`org/repo-${ACTIVE_REPOS.max + 4}`)
    expect(refs.some((r) => r.nameWithOwner.includes("private-repo"))).toBe(false)
    expect(refs.some((r) => r.nameWithOwner.includes("forked"))).toBe(false)
    expect(refs.some((r) => r.nameWithOwner.includes("few-commits"))).toBe(false)
  })
})

describe("buildFacts", () => {
  it("transforms user profile, active repo nodes, commits, and top organization into PlayerFacts", () => {
    const user = makeUser({
      repositories: {
        nodes: [
          makeOwnedNode({ name: "Ada" }),
          makeOwnedNode({
            name: "app",
            readmeUpper: { byteSize: 300 },
            readmeLower: { byteSize: 950 }
          })
        ]
      },
      contributionsCollection: {
        ...makeUser().contributionsCollection,
        commitContributionsByRepository: [
          {
            contributions: { totalCount: 5 },
            repository: {
              nameWithOwner: "private-org/hidden",
              isFork: false,
              isPrivate: true,
              stargazerCount: 0,
              owner: { login: "private-org", __typename: "Organization" }
            }
          },
          {
            contributions: { totalCount: 25 },
            repository: {
              nameWithOwner: "acme/lib",
              isFork: false,
              isPrivate: false,
              stargazerCount: 50,
              owner: { login: "acme", __typename: "Organization" }
            }
          }
        ]
      }
    })

    const facts = buildFacts({
      user,
      mergedExternalPrs: 14,
      activeRefs: [
        { owner: "ada", name: "app", nameWithOwner: "ada/app", userCommitsLastYear: 20 },
        { owner: "ada", name: "missing", nameWithOwner: "ada/missing", userCommitsLastYear: 5 }
      ],
      activeNodes: {
        r0: makeActiveNode(),
        r1: null
      },
      yearly: [{ year: 2026, total: 200, reviews: 12 }],
      starredRepos: [
        { name: "ada", stars: 99, forks: 1, language: null },
        { name: "app", stars: 10, forks: 2, language: "TypeScript" }
      ],
      ownOrgPrs: [{ org: "acme", prs: 3 }],
      commitSampleSize: 1
    })

    expect(facts.topOrg).toBe("acme")
    expect(facts.githubId).toBe(42)
    expect(facts.ownedRepos).toHaveLength(1)
    expect(facts.ownedRepos[0]?.readmeBytes).toBe(950)
    expect(facts.starredRepos).toEqual([
      { name: "app", stars: 10, forks: 2, language: "TypeScript" }
    ])
    expect(facts.activeRepos).toHaveLength(1)
    expect(facts.activeRepos[0]).toMatchObject({
      nameWithOwner: "ada/app",
      hasTests: true,
      hasCi: true,
      checkStates: ["SUCCESS"]
    })
    // Sorted newest-first, merge/other-author commits dropped, sliced to commitSampleSize=1.
    expect(facts.commits.map((c) => c.sha)).toEqual(["444"])
    expect(facts.calendar).toEqual([
      { date: "2026-11-22", count: 2 },
      { date: "2026-11-23", count: 0 }
    ])
    expect(facts.repoCommits).toEqual([{ repo: "acme/lib", commits: 25, stars: 50 }])
  })
})
