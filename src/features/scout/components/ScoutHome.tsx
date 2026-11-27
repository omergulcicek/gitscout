import { getRouteApi, Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

import { getLangParam } from "@/helpers/localized-url"

import { GithubStarLink } from "@/components/shared/GithubStarLink"
import { buttonVariants } from "@/components/ui/button"
import { AddPlayerForm } from "@/features/scout/components/AddPlayerForm"
import { EmptyLeaderboard } from "@/features/scout/components/EmptyLeaderboard"
import { ExamplePlayers } from "@/features/scout/components/ExamplePlayers"
import { FeaturedCard } from "@/features/scout/components/FeaturedCard"
import { HeroProof } from "@/features/scout/components/HeroProof"
import { LeaderboardTable } from "@/features/scout/components/LeaderboardTable"
import { RarityLegend } from "@/features/scout/components/RarityLegend"
import { RecentlyAdded } from "@/features/scout/components/RecentlyAdded"
import { TopViewSwitch } from "@/features/scout/components/TopViewSwitch"
import type { TopView } from "@/features/scout/components/TopViewSwitch"
import { useHome } from "@/features/scout/hooks/use-home"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/** Rows in the top list; must match the server's home top limit. */
const HOME_LIMIT = 10

const routeApi = getRouteApi("/{-$lang}/")

export function ScoutHome() {
  const { data } = useHome()
  const { top } = routeApi.useSearch()

  // Only the Turkish page has the Türkiye list, and it's the default there; English always shows everyone.
  const canSwitch = getLocale() === "tr" && data.totals.tr > 0
  const view: TopView = canSwitch && top !== "world" ? "tr" : "world"
  const players = data.top[view]
  const poolSize = data.totals[view]

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <section className="flex max-w-2xl flex-col gap-5 pt-4 sm:pt-8">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {m.home_title()}
          </h1>
          <p className="max-w-xl font-mono text-pretty text-muted-foreground sm:text-lg">
            {m.home_lead()}
          </p>
          <AddPlayerForm variant="command" />
          <ExamplePlayers players={data.examples} />
          <HeroProof
            recent={data.recent}
            total={data.totals.world}
            lastDayCount={data.lastDayCount}
          />
          <GithubStarLink placement="hero" className="self-start" />
        </section>
        {/* Ödül önden görünsün: geniş ekranda vitrin kartı başlığın yanında. */}
        <FeaturedCard players={data.featured} />
      </div>

      <RecentlyAdded
        entries={data.recent}
        lastDayCount={data.lastDayCount}
        generatedAt={data.generatedAt}
      />

      <section className="flex flex-col gap-4" aria-labelledby="leaderboard-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 id="leaderboard-heading" className="text-xl font-semibold">
              {m.home_top({ count: HOME_LIMIT })}
            </h2>
            {canSwitch ? <TopViewSwitch view={view} /> : null}
          </div>
          {poolSize > HOME_LIMIT ? (
            <Link
              to="/{-$lang}/leaderboard"
              params={{ lang: getLangParam() }}
              search={view === "tr" ? { country: "tr" } : {}}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {view === "tr"
                ? m.home_full_table_tr({ count: poolSize })
                : m.home_full_table({ count: poolSize })}
              <ArrowRight aria-hidden />
            </Link>
          ) : null}
        </div>

        {data.totals.world === 0 ? (
          <EmptyLeaderboard />
        ) : (
          <>
            <LeaderboardTable players={players} />
            <RarityLegend className="justify-center" />
          </>
        )}
      </section>
    </main>
  )
}
