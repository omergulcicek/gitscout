import { z } from "zod"

/** GitHub GraphQL yanıtlarının yalnızca kullandığımız alanları. */

const blobSize = z.object({ byteSize: z.number() }).nullable()
const treeEntries = z.object({ entries: z.array(z.object({ name: z.string() })) }).nullable()

const ownedRepoNodeSchema = z.object({
  name: z.string(),
  isArchived: z.boolean(),
  pushedAt: z.string().nullable(),
  stargazerCount: z.number(),
  forkCount: z.number(),
  description: z.string().nullable(),
  homepageUrl: z.string().nullable(),
  repositoryTopics: z.object({ totalCount: z.number() }),
  licenseInfo: z.object({ spdxId: z.string().nullable() }).nullable(),
  languages: z
    .object({
      edges: z.array(z.object({ size: z.number(), node: z.object({ name: z.string() }) }))
    })
    .nullable(),
  readmeUpper: blobSize,
  readmeLower: blobSize
})

export const reposPageSchema = z.object({
  user: z.object({
    repositories: z.object({
      pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
      nodes: z.array(ownedRepoNodeSchema)
    })
  })
})

const profileResponseSchema = z.object({
  user: z
    .object({
      id: z.string(),
      /** The numeric account id; it never changes, unlike the login. */
      databaseId: z.number(),
      login: z.string(),
      name: z.string().nullable(),
      bio: z.string().nullable(),
      company: z.string().nullable(),
      location: z.string().nullable(),
      avatarUrl: z.string(),
      createdAt: z.string(),
      followers: z.object({ totalCount: z.number() }),
      repositories: z.object({ nodes: z.array(ownedRepoNodeSchema) }),
      contributionsCollection: z.object({
        totalCommitContributions: z.number(),
        totalPullRequestContributions: z.number(),
        totalPullRequestReviewContributions: z.number(),
        totalIssueContributions: z.number(),
        restrictedContributionsCount: z.number(),
        contributionCalendar: z.object({
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({ date: z.string(), contributionCount: z.number() })
              )
            })
          )
        }),
        commitContributionsByRepository: z.array(
          z.object({
            contributions: z.object({ totalCount: z.number() }),
            repository: z.object({
              nameWithOwner: z.string(),
              isFork: z.boolean(),
              isPrivate: z.boolean(),
              stargazerCount: z.number(),
              owner: z.object({ login: z.string(), __typename: z.string() })
            })
          })
        )
      })
    })
    .nullable(),
  mergedPrs: z.object({ issueCount: z.number() })
})

export type ProfileResponse = z.infer<typeof profileResponseSchema>

const commitNode = z.object({
  oid: z.string(),
  messageHeadline: z.string(),
  committedDate: z.string(),
  changedFilesIfAvailable: z.number().nullable(),
  parents: z.object({ totalCount: z.number() }),
  author: z.object({ user: z.object({ login: z.string() }).nullable() }).nullable()
})

const activeRepoNodeSchema = z
  .object({
    nameWithOwner: z.string(),
    stargazerCount: z.number(),
    forkCount: z.number(),
    owner: z.object({ __typename: z.string() }),
    languages: z
      .object({
        edges: z.array(z.object({ size: z.number(), node: z.object({ name: z.string() }) }))
      })
      .nullable(),
    root: treeEntries,
    workflows: treeEntries,
    pkg: z.object({ text: z.string().nullable() }).nullable(),
    defaultBranchRef: z
      .object({
        target: z
          .object({
            yearTotal: z.object({ totalCount: z.number() }),
            mineYear: z.object({ totalCount: z.number() }),
            allTotal: z.object({ totalCount: z.number() }),
            mineAll: z.object({ totalCount: z.number() }),
            agentsYear: z.object({ totalCount: z.number() }),
            agentsAll: z.object({ totalCount: z.number() }),
            checks: z.object({
              nodes: z.array(
                z.object({ statusCheckRollup: z.object({ state: z.string() }).nullable() })
              )
            }),
            mine: z.object({ nodes: z.array(commitNode) })
          })
          .nullable()
      })
      .nullable()
  })
  .nullable()

export type ActiveRepoNode = z.infer<typeof activeRepoNodeSchema>

export const activeResponseSchema = z.record(z.string(), activeRepoNodeSchema)

export const yearlyResponseSchema = z.object({
  user: z.record(
    z.string(),
    z.object({
      totalPullRequestReviewContributions: z.number(),
      contributionCalendar: z.object({ totalContributions: z.number() })
    })
  )
})

export const starredPageSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          name: z.string(),
          stargazerCount: z.number(),
          forkCount: z.number(),
          primaryLanguage: z.object({ name: z.string() }).nullable()
        })
      )
    })
  })
})

export const searchCountsSchema = z.record(z.string(), z.object({ issueCount: z.number() }))

export const graphqlEnvelopeSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string(), type: z.string().optional() })).optional()
})

export const profileBaseSchema = z.object({
  user: profileResponseSchema.shape.user.unwrap().omit({ repositories: true }).nullable(),
  mergedPrs: z.object({ issueCount: z.number() })
})

export const patchSchema = z.string()
