import { describe, expect, it } from "vitest"

import { ACT } from "@/features/scout/constants/scoring.constants"
import { computeBadges } from "@/features/scout/helpers/compute-badges"
import type {
  ActiveRepo,
  CommitSample,
  OwnedRepo,
  PlayerFacts
} from "@/features/scout/types/player.types"

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

function makeCommit(date: string, message = "feat: update"): CommitSample {
  return {
    repo: "ada/app",
    sha: "abc123",
    isMerge: false,
    message,
    date,
    changedFiles: 1
  }
}

function makeActiveRepo(overrides: Partial<ActiveRepo> = {}): ActiveRepo {
  return {
    nameWithOwner: "acme/lib",
    isOrg: false,
    stars: 0,
    forks: 0,
    languages: [],
    yearCommits: 50,
    userYearCommits: 10,
    hasTests: false,
    hasCi: false,
    checkStates: [],
    userCommitsLastYear: 10,
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

describe("computeBadges — time-based badges", () => {
  it("requires a clock and at least 30 commits", () => {
    const nightCommits = Array.from({ length: 29 }, () => makeCommit("2026-11-23T02:00:00Z"))
    expect(computeBadges(makeFacts({ commits: nightCommits }), { offsetMinutes: 0 }, NOW)).toEqual(
      []
    )

    const thirtyCommits = Array.from({ length: 30 }, () => makeCommit("2026-11-23T02:00:00Z"))
    expect(computeBadges(makeFacts({ commits: thirtyCommits }), null, NOW)).not.toContainEqual(
      expect.objectContaining({ id: "night-owl" })
    )
  })

  it("awards night-owl, early-bird, and weekend-warrior using offsetMinutes", () => {
    // UTC+3: 02:30Z -> 05:30 local (both night-owl <6 and early-bird [5,9)).
    // 2026-11-21 is Saturday.
    const saturdayMorning = Array.from({ length: 12 }, () => makeCommit("2026-11-21T02:30:00Z"))
    const tuesdayAfternoon = Array.from({ length: 18 }, () => makeCommit("2026-11-24T12:00:00Z"))
    const badges = computeBadges(
      makeFacts({ commits: [...saturdayMorning, ...tuesdayAfternoon] }),
      { offsetMinutes: 180 },
      NOW
    )

    expect(badges).toContainEqual({ id: "night-owl", values: { pct: 40 } })
    expect(badges).toContainEqual({ id: "early-bird", values: { pct: 40 } })
    expect(badges).toContainEqual({ id: "weekend-warrior", values: { pct: 40 } })
  })

  it("evaluates local hour and weekday with an IANA timeZone", () => {
    // 2026-11-21T04:30:00Z -> 23:30 Friday in America/New_York (EST, UTC-5): neither night nor weekend.
    const commits = Array.from({ length: 30 }, () => makeCommit("2026-11-21T04:30:00Z"))
    const badges = computeBadges(makeFacts({ commits }), { timeZone: "America/New_York" }, NOW)

    expect(badges.map((b) => b.id)).not.toContain("night-owl")
    expect(badges.map((b) => b.id)).not.toContain("weekend-warrior")
  })
})

describe("computeBadges — threshold badges", () => {
  it("awards conventional-disciple only when commits >= 30 and ratio >= 80%", () => {
    const twentyNine = Array.from({ length: 29 }, () => makeCommit("2026-11-24T12:00:00Z"))
    expect(computeBadges(makeFacts({ commits: twentyNine }), null, NOW)).toEqual([])

    const mixed = [
      ...Array.from({ length: 24 }, () => makeCommit("2026-11-24T12:00:00Z", "feat: ok")),
      ...Array.from({ length: 6 }, () => makeCommit("2026-11-24T12:00:00Z", "wip"))
    ]
    expect(computeBadges(makeFacts({ commits: mixed }), null, NOW)).toContainEqual({
      id: "conventional-disciple",
      values: { pct: 80 }
    })
  })

  it("awards marathon, green-tick, polyglot, and test-obsessed when thresholds are met", () => {
    const calendar = Array.from({ length: 30 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      count: 1
    }))
    const languages = ["TypeScript", "Go", "Rust", "Python", "CSS"].map((name) => ({
      name,
      size: 200
    }))

    const facts = makeFacts({
      calendar,
      ownedRepos: [makeOwnedRepo({ languages })],
      activeRepos: [
        makeActiveRepo({
          nameWithOwner: "ada/a",
          hasTests: true,
          checkStates: [...Array.from({ length: 9 }, () => "SUCCESS" as const), "FAILURE"]
        }),
        makeActiveRepo({ nameWithOwner: "ada/b", hasTests: true }),
        makeActiveRepo({ nameWithOwner: "ada/c", hasTests: true })
      ]
    })

    const badges = computeBadges(facts, null, NOW)
    expect(badges).toContainEqual({ id: "marathon", values: { days: 30 } })
    expect(badges).toContainEqual({ id: "green-tick", values: { total: 10, pct: 90 } })
    expect(badges).toContainEqual({
      id: "polyglot",
      values: { count: 5, languages: "TypeScript, Go, Rust, Python, CSS" }
    })
    expect(badges).toContainEqual({ id: "test-obsessed", values: { active: 3, tested: 3 } })
  })

  it("subtracts automated commits before awarding commit-machine", () => {
    const inflated = makeFacts({
      lastYear: { commits: 1_500, prs: 0, reviews: 0, issues: 0, restricted: 0 },
      repoCommits: [{ repo: "ada/bot", commits: ACT.repoYearCap + 600, stars: 0 }]
    })
    expect(computeBadges(inflated, null, NOW)).not.toContainEqual(
      expect.objectContaining({ id: "commit-machine" })
    )

    const genuine = makeFacts({
      lastYear: { commits: 1_500, prs: 0, reviews: 0, issues: 0, restricted: 0 },
      repoCommits: [{ repo: "ada/app", commits: ACT.repoYearCap, stars: 0 }]
    })
    expect(computeBadges(genuine, null, NOW)).toContainEqual({
      id: "commit-machine",
      values: { commits: 1_500 }
    })
  })

  it("awards star-collector, oss-ambassador, pr-machine, code-reviewer, community-leader, team-player", () => {
    const facts = makeFacts({
      followers: 1_000,
      mergedExternalPrs: 20,
      lastYear: { commits: 0, prs: 100, reviews: 100, issues: 0, restricted: 0 },
      ownedRepos: [makeOwnedRepo({ stars: 1_000 })],
      activeRepos: [
        makeActiveRepo({ nameWithOwner: "org/one", isOrg: true, userYearCommits: 10 }),
        makeActiveRepo({ nameWithOwner: "org/two", isOrg: true, userYearCommits: 12 }),
        makeActiveRepo({ nameWithOwner: "org/three", isOrg: true, userYearCommits: 9 })
      ]
    })

    const badges = computeBadges(facts, null, NOW)
    expect(badges).toContainEqual({ id: "star-collector", values: { stars: 1_000 } })
    expect(badges).toContainEqual({ id: "oss-ambassador", values: { prs: 20 } })
    expect(badges).toContainEqual({ id: "pr-machine", values: { prs: 100 } })
    expect(badges).toContainEqual({ id: "code-reviewer", values: { reviews: 100 } })
    expect(badges).toContainEqual({ id: "community-leader", values: { followers: 1_000 } })
    expect(badges).toContainEqual({ id: "team-player", values: { repos: 2, min: 10 } })
  })

  it("ignores archived repos for documenter and awards veteran and regular", () => {
    const calendar = Array.from({ length: 40 * 7 }, (_, i) => ({
      date: `d-${i}`,
      count: i % 7 === 0 ? 1 : 0
    }))
    const facts = makeFacts({
      createdAt: "2016-01-01T00:00:00Z",
      calendar,
      ownedRepos: [
        makeOwnedRepo({ name: "1", hasDescription: true, readmeBytes: 1000 }),
        makeOwnedRepo({ name: "2", hasDescription: true, readmeBytes: 1500 }),
        makeOwnedRepo({ name: "3", hasDescription: true, readmeBytes: 1000 }),
        makeOwnedRepo({ name: "4", hasDescription: true, readmeBytes: 1000 }),
        makeOwnedRepo({ name: "5", hasDescription: false, readmeBytes: 1000 }),
        makeOwnedRepo({
          name: "archived-undoc",
          isArchived: true,
          hasDescription: false,
          readmeBytes: 0
        })
      ]
    })

    const badges = computeBadges(facts, null, NOW)
    expect(badges).toContainEqual({ id: "documenter", values: { total: 5, documented: 4 } })
    expect(badges).toContainEqual({ id: "veteran", values: { years: 10 } })
    expect(badges).toContainEqual({ id: "regular", values: { weeks: 40 } })
  })
})
