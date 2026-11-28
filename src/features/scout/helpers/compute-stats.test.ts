import { describe, expect, it } from "vitest"

import { ACT, EXP, IMP } from "@/features/scout/constants/scoring.constants"
import {
  activeWeeks,
  automatedCommits,
  checkSuccessRate,
  computeStats,
  externalPrs,
  isConventional,
  longestStreak,
  orgCommitShare,
  significantLanguages,
  toDisplayScore,
  toExactDisplayScore
} from "@/features/scout/helpers/compute-stats"
import type { ActiveRepo, OwnedRepo, PlayerFacts } from "@/features/scout/types/player.types"

const NOW = new Date("2026-11-24T12:00:00Z")

function makeFacts(overrides: Partial<PlayerFacts> = {}): PlayerFacts {
  return {
    login: "ada",
    name: "Ada Lovelace",
    avatarUrl: "https://example.com/ada.png",
    bio: null,
    company: null,
    followers: 0,
    createdAt: "2020-01-01T00:00:00Z",
    topOrg: null,
    mergedExternalPrs: 0,
    lastYear: { commits: 0, prs: 0, reviews: 0, issues: 0, restricted: 0 },
    ownedRepos: [],
    activeRepos: [],
    commits: [],
    calendar: [],
    yearly: [],
    ...overrides
  }
}

function makeOwnedRepo(overrides: Partial<OwnedRepo> = {}): OwnedRepo {
  return {
    name: "app",
    isArchived: false,
    pushedAt: NOW.toISOString(),
    stars: 0,
    forks: 0,
    hasDescription: true,
    hasHomepage: false,
    topicCount: 0,
    license: "MIT",
    readmeBytes: 1200,
    languages: [],
    ...overrides
  }
}

function makeActiveRepo(overrides: Partial<ActiveRepo> = {}): ActiveRepo {
  return {
    nameWithOwner: "acme/lib",
    isOrg: true,
    stars: 0,
    forks: 0,
    languages: [],
    yearCommits: 100,
    userYearCommits: 10,
    hasTests: false,
    hasCi: false,
    checkStates: [],
    userCommitsLastYear: 10,
    ...overrides
  }
}

describe("toExactDisplayScore & toDisplayScore", () => {
  it("clamps inputs below 0 and above 100", () => {
    expect(toExactDisplayScore(-20)).toBe(30)
    expect(toExactDisplayScore(150)).toBe(99)
    expect(toDisplayScore(-5)).toBe(30)
    expect(toDisplayScore(120)).toBe(99)
  })

  it("interpolates linearly between DISPLAY_CURVE knots", () => {
    // Midpoint between [0, 30] and [20, 55] is [10, 42.5].
    expect(toExactDisplayScore(10)).toBe(42.5)
    expect(toDisplayScore(10)).toBe(43)
    // Midpoint between [82, 90] and [100, 99] is [91, 94.5].
    expect(toExactDisplayScore(91)).toBe(94.5)
  })
})

describe("isConventional", () => {
  it("accepts trimmed conventional commit headers with allowed types", () => {
    expect(isConventional("  fix(auth): refresh expired token")).toBe(true)
    expect(isConventional("tests: cover helper edge cases")).toBe(true)
    expect(isConventional("revert!: drop legacy endpoint")).toBe(true)
  })

  it("rejects missing descriptions, missing spaces, or unsupported types", () => {
    expect(isConventional("feat:   ")).toBe(false)
    expect(isConventional("feat:missing space")).toBe(false)
    expect(isConventional("wip: quick save")).toBe(false)
    expect(isConventional("Fix: capitalized type")).toBe(false)
  })
})

describe("longestStreak & activeWeeks", () => {
  it("computes the longest consecutive active days across gaps", () => {
    expect(longestStreak([])).toBe(0)
    expect(
      longestStreak([
        { date: "2026-01-01", count: 0 },
        { date: "2026-01-02", count: 2 },
        { date: "2026-01-03", count: 1 },
        { date: "2026-01-04", count: 0 },
        { date: "2026-01-05", count: 3 },
        { date: "2026-01-06", count: 4 },
        { date: "2026-01-07", count: 1 }
      ])
    ).toBe(3)
  })

  it("counts active weeks only within the trailing 52 weeks", () => {
    const olderWeek = Array.from({ length: 7 }, (_, i) => ({
      date: `2025-01-0${i + 1}`,
      count: 5
    }))
    const trailingZeroes = Array.from({ length: 52 * 7 }, (_, i) => ({
      date: `d-${i}`,
      count: i === 0 || i === 14 ? 1 : 0
    }))
    expect(activeWeeks([...olderWeek, ...trailingZeroes])).toBe(2)
  })
})

describe("checkSuccessRate", () => {
  it("ignores PENDING and EXPECTED states and handles empty check lists", () => {
    const empty = makeFacts({
      activeRepos: [makeActiveRepo({ checkStates: ["PENDING", "EXPECTED"] })]
    })
    expect(checkSuccessRate(empty)).toEqual({ rate: 0, total: 0 })

    const mixed = makeFacts({
      activeRepos: [
        makeActiveRepo({ checkStates: ["SUCCESS", "FAILURE", "PENDING"] }),
        makeActiveRepo({ nameWithOwner: "acme/cli", checkStates: ["SUCCESS", "ERROR", "EXPECTED"] })
      ]
    })
    expect(checkSuccessRate(mixed)).toEqual({ rate: 0.5, total: 4 })
  })
})

describe("orgCommitShare", () => {
  it("returns 0 when user has no commits and respects minShareBase", () => {
    expect(orgCommitShare({ yearCommits: 50, userYearCommits: 0 })).toBe(0)
    expect(
      orgCommitShare({
        yearCommits: 10,
        userYearCommits: 10,
        agentYearCommits: 5
      })
    ).toBe(10 / IMP.minShareBase)
  })
})

describe("automatedCommits", () => {
  it("sums only commits exceeding ACT.repoYearCap per repository", () => {
    const facts = makeFacts({
      repoCommits: [
        { repo: "ada/normal", commits: ACT.repoYearCap, stars: 10 },
        { repo: "ada/bot-a", commits: ACT.repoYearCap + 150, stars: 0 },
        { repo: "ada/bot-b", commits: ACT.repoYearCap + 50, stars: 0 }
      ]
    })
    expect(automatedCommits(facts)).toBe(200)
    expect(automatedCommits(makeFacts())).toBe(0)
  })
})

describe("significantLanguages", () => {
  it("merges owned and org repo languages without double-counting and filters under 5%", () => {
    const facts = makeFacts({
      login: "ada",
      ownedRepos: [
        makeOwnedRepo({
          name: "core",
          languages: [
            { name: "TypeScript", size: 900 },
            { name: "CSS", size: 40 }
          ]
        })
      ],
      activeRepos: [
        // Same owner/name as owned repo should not be counted twice.
        makeActiveRepo({
          nameWithOwner: "ada/core",
          isOrg: true,
          languages: [{ name: "CSS", size: 10_000 }]
        }),
        makeActiveRepo({
          nameWithOwner: "acme/backend",
          isOrg: true,
          languages: [{ name: "Go", size: 60 }]
        })
      ]
    })

    const result = significantLanguages(facts)
    expect(result.map((l) => l.name)).toEqual(["TypeScript", "Go"])
    expect(result[0]?.share).toBeCloseTo(0.9)
    expect(result[1]?.share).toBeCloseTo(0.06)
  })

  it("returns an empty array when total language size is 0", () => {
    expect(significantLanguages(makeFacts())).toEqual([])
  })
})

describe("externalPrs", () => {
  it("clamps ownOrgPrs to mergedExternalPrs so the result never turns negative", () => {
    const facts = makeFacts({
      mergedExternalPrs: 10,
      ownOrgPrs: [{ org: "acme", prs: 50 }]
    })
    expect(externalPrs(facts)).toBe(5)
  })
})

describe("computeStats", () => {
  it("computes all six stat categories and caps per-year lifetime contributions", () => {
    const calendar = Array.from({ length: 100 }, (_, i) => ({
      date: `2026-06-${String((i % 28) + 1).padStart(2, "0")}`,
      count: 5
    }))
    const facts = makeFacts({
      followers: 1_500,
      mergedExternalPrs: 200,
      ownedRepos: [makeOwnedRepo({ stars: 2_000, forks: 400 })],
      activeRepos: [
        makeActiveRepo({
          stars: 1_000,
          forks: 200,
          yearCommits: 100,
          userYearCommits: 50
        })
      ],
      calendar,
      yearly: [
        { year: 2024, total: EXP.lifetime.yearCap + 50_000, reviews: 80 },
        { year: 2025, total: 500, reviews: 20 }
      ]
    })

    const stats = computeStats(facts, NOW)
    expect(stats.act.summary).toEqual({ key: "act", contributions: 500 })
    expect(stats.imp.summary).toEqual({ key: "imp", stars: 2_500, forks: 500 })
    expect(stats.com.summary).toEqual({ key: "com", followers: 1_500 })
    expect(stats.rep.summary).toEqual({ key: "rep", prs: 200, reviews: 100 })
    expect(stats.con.summary).toEqual({ key: "con", days: 100, streak: 100 })
    expect(stats.exp.summary).toEqual({
      key: "exp",
      years: 2,
      contributions: EXP.lifetime.yearCap + 500
    })

    for (const stat of Object.values(stats)) {
      expect(stat.raw).toBeGreaterThan(0)
      expect(stat.raw).toBeLessThanOrEqual(100)
      expect(stat.value).toBe(toDisplayScore(stat.raw))
    }
  })
})
