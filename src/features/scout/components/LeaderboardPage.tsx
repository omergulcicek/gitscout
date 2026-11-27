import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CountryFilterMenu } from "@/features/scout/components/CountryFilterMenu"
import { DailyBest } from "@/features/scout/components/DailyBest"
import { EmptyLeaderboard } from "@/features/scout/components/EmptyLeaderboard"
import { LeaderboardFilters } from "@/features/scout/components/LeaderboardFilters"
import { LeaderboardLead } from "@/features/scout/components/LeaderboardLead"
import { LeaderboardSkeleton } from "@/features/scout/components/LeaderboardSkeleton"
import { LeaderboardTable } from "@/features/scout/components/LeaderboardTable"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { RarityFilterChips } from "@/features/scout/components/RarityFilterChips"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import { useLeaderboardSlice } from "@/features/scout/hooks/use-leaderboard-slice"
import { LEADERBOARD_PAGE_SIZE } from "@/features/scout/schemas/leaderboard-search.schema"
import * as m from "@/paraglide/messages.js"

export function LeaderboardPage() {
  const { data, isPlaceholderData } = useLeaderboardSlice()
  const { search, filters, update, setFilters } = useLeaderboardSearch()
  // The route loader fills the cache before the first render, so this only shows on an unexpected miss.
  if (!data) return <LeaderboardSkeleton />

  const { slice, facets, dailyBest } = data
  const query = search.q ?? ""
  const remaining = slice.matched - slice.players.length
  const hasFilters =
    filters.positions.length > 0 ||
    filters.rarities.length > 0 ||
    filters.country !== undefined ||
    filters.star ||
    filters.verified

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      <PageHeader title={m.leaderboard_title()}>
        {facets.total > 0 ? (
          <LeaderboardLead total={facets.total} rarityCounts={facets.rarityCounts} />
        ) : null}
      </PageHeader>

      <DailyBest slots={dailyBest} />

      {facets.total > 0 ? (
        <div className="flex flex-col gap-3">
          {/* Dar ekranda arama tek satırı kaplar; ülke ve filtre butonları alt satırda yan yana durur. */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => update({ q: event.target.value || undefined })}
                placeholder={m.search_placeholder()}
                aria-label={m.search_label()}
                className="h-8 ps-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <CountryFilterMenu facets={facets} />
              <LeaderboardFilters facets={facets} />
              {hasFilters ? (
                <Button
                  variant="link"
                  size="sm"
                  className="px-1 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    setFilters({
                      positions: [],
                      rarities: [],
                      country: undefined,
                      star: false,
                      verified: false
                    })
                  }
                >
                  {m.filter_clear()}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <RarityFilterChips counts={facets.rarityCounts} />
            <span className="text-sm text-muted-foreground">
              {slice.matched === facets.total
                ? m.players_count({ count: slice.matched })
                : m.players_count_filtered({ shown: slice.matched, total: facets.total })}
            </span>
          </div>
        </div>
      ) : null}

      {facets.total === 0 ? (
        <EmptyLeaderboard />
      ) : slice.matched === 0 ? (
        <p className="surface px-4 py-8 text-center text-sm text-muted-foreground">
          {m.filter_empty()}
        </p>
      ) : (
        <>
          {/* Dimmed while the next page loads; the previous rows stay so the table doesn't jump. */}
          <div
            aria-busy={isPlaceholderData}
            className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}
          >
            <LeaderboardTable players={slice.players} manualSorting />
          </div>
          {remaining > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                onClick={() => update({ limit: search.limit + LEADERBOARD_PAGE_SIZE })}
              >
                {m.leaderboard_show_more({ count: Math.min(remaining, LEADERBOARD_PAGE_SIZE) })}
              </Button>
              <p className="text-xs text-muted-foreground">
                {m.leaderboard_shown({ shown: slice.players.length, total: slice.matched })}
              </p>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
