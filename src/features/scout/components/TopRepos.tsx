import { GitFork, Star } from "lucide-react"

import { LanguageIcon } from "@/features/scout/components/LanguageIcon"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type TopReposProps = {
  repos: ScoredPlayer["topRepos"]
}

/** En çok yıldız alan public repolar: kartın arkasındaki işleri gösterir. */
export function TopRepos({ repos }: TopReposProps) {
  const number = new Intl.NumberFormat(getLocale(), {
    notation: "compact",
    maximumFractionDigits: 1
  })

  return (
    <section className="surface flex flex-col overflow-hidden" aria-labelledby="repos-heading">
      <h2 id="repos-heading" className="px-4 pt-4 pb-2 text-sm font-medium">
        {m.top_repos()}
      </h2>
      {repos.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-balance text-muted-foreground">
          {m.top_repos_empty()}
        </p>
      ) : (
        // Geniş ekranda radar yüksekliği üçe bölünür: az repoda satırlar uzamaz, alt boş kalır.
        <ul className="flex flex-1 flex-col divide-y border-t lg:grid lg:grid-rows-3">
          {repos.map((repo) => {
            // Kendi reposunda sahip zaten bu oyuncu; katkı verdiği repoda ürünün sahibi de yazılır.
            const [owner = "", name = repo.fullName] = repo.fullName.split("/")
            return (
              <li key={repo.fullName} className="flex flex-1">
                <a
                  href={`https://github.com/${repo.fullName}`}
                  target="_blank"
                  rel="noreferrer"
                  title={repo.fullName}
                  className="flex w-full flex-col justify-center gap-1.5 px-4 py-3 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <LanguageIcon name={repo.language} />
                    <span lang="en" className="truncate font-medium">
                      <span aria-hidden className="text-muted-foreground">
                        {repo.isOrg ? owner : null}/
                      </span>
                      {name}
                    </span>
                    {repo.isOrg ? (
                      <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {m.repo_contrib()}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground tabular-nums">
                    <span className="flex items-center gap-1">
                      <Star aria-hidden className="size-3.5" />
                      <span className="sr-only">{m.stars_label()}</span>
                      {number.format(repo.stars)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork aria-hidden className="size-3.5" />
                      <span className="sr-only">{m.forks_label()}</span>
                      {number.format(repo.forks)}
                    </span>
                  </span>
                  <span className="sr-only">
                    {" "}
                    {repo.fullName} {m.new_tab()}
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
