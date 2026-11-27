// One-off backfill: stores GitHub's numeric account id (`facts.githubId`) on cards fetched before it existed.
// Accounts are linked to cards by that id, so cards without it show no verified badge until it's filled.
// Safe to run again: only cards still missing the id are touched.
//
//   node --env-file=.env.local scripts/backfill-github-ids.ts          # dry run, writes nothing
//   node --env-file=.env.local scripts/backfill-github-ids.ts --write  # stores the ids
//
// Needs GITHUB_TOKEN and REFRESH_DATABASE_URL (the refresher role may update `facts`).

import postgres from "postgres"

const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i
/** Logins per GraphQL request; each is one aliased `user` field. */
const BATCH = 50

const write = process.argv.includes("--write")
const token = process.env.GITHUB_TOKEN
const databaseUrl = process.env.REFRESH_DATABASE_URL
if (!token || !databaseUrl) throw new Error("GITHUB_TOKEN and REFRESH_DATABASE_URL are required")

const sql = postgres(databaseUrl, { prepare: false, max: 1 })

const print = (line: string) => process.stdout.write(`${line}\n`)

/** GitHub ids for `logins`, by lowercased login; logins that no longer exist are left out. */
async function fetchIds(logins: string[]): Promise<Map<string, number>> {
  const fields = logins
    .map((login, index) => `u${index}: user(login: "${login}") { login databaseId }`)
    .join("\n")
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: `query { ${fields} }` })
  })
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`)
  const body: unknown = await response.json()
  const data = (body as { data?: Record<string, { login: string; databaseId: number } | null> })
    .data
  const ids = new Map<string, number>()
  for (const user of Object.values(data ?? {})) {
    if (user && Number.isInteger(user.databaseId))
      ids.set(user.login.toLowerCase(), user.databaseId)
  }
  return ids
}

try {
  const rows = await sql<{ login: string }[]>`
    select login from players where facts ->> 'githubId' is null order by login
  `
  const logins = rows.map((row) => row.login).filter((login) => LOGIN.test(login))
  const ids = new Map<string, number>()
  for (let start = 0; start < logins.length; start += BATCH) {
    for (const [login, id] of await fetchIds(logins.slice(start, start + BATCH))) ids.set(login, id)
  }

  const missing = logins.filter((login) => !ids.has(login))
  print(
    `cards without id: ${rows.length}, found on GitHub: ${ids.size}, not found: ${missing.length}`
  )
  if (missing.length > 0) print(`not found: ${missing.join(", ")}`)

  if (write) {
    let updated = 0
    await sql.begin(async (tx) => {
      for (const [login, id] of ids) {
        const result = await tx`
          update players
          set facts = facts || jsonb_build_object('githubId', ${id}::bigint)
          where login = ${login} and facts ->> 'githubId' is null
        `
        updated += result.count
      }
    })
    print(`updated: ${updated}`)
  } else {
    print("dry run; pass --write to store the ids")
  }
} finally {
  await sql.end()
}
