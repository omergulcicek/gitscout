import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CountryFilterMenu } from "@/features/scout/components/CountryFilterMenu"
import { EmptyLeaderboard } from "@/features/scout/components/EmptyLeaderboard"
import { LeaderboardFilters } from "@/features/scout/components/LeaderboardFilters"
import { LeaderboardLead } from "@/features/scout/components/LeaderboardLead"
import { LeaderboardTable } from "@/features/scout/components/LeaderboardTable"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { RarityFilterChips } from "@/features/scout/components/RarityFilterChips"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { playerCountryFilter } from "@/features/scout/helpers/player-country"
import { matchesPlayer } from "@/features/scout/helpers/search-text"
import { useLeaderboard } from "@/features/scout/hooks/use-leaderboard"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import { LEADERBOARD_PAGE_SIZE } from "@/features/scout/schemas/leaderboard-search.schema"
import * as m from "@/paraglide/messages.js"

export function LeaderboardPage() {
  const { data } = useLeaderboard()
  const { players: allPlayers } = data
  const { search, filters, update, setFilters } = useLeaderboardSearch()
  const query = search.q ?? ""
  // Sıra numarası seçili mevki, kart türü, ülke ve onay filtresi içinde sayılır; isim araması sırayı değiştirmez,
  // yoksa aranan herkes 1. görünür.
  const rankPool = allPlayers.filter(
    (player) =>
      (filters.positions.length === 0 || filters.positions.includes(player.position)) &&
      (filters.rarities.length === 0 || filters.rarities.includes(player.rarity)) &&
      (filters.country === undefined || playerCountryFilter(player) === filters.country) &&
      (!filters.star || isGithubStar(player.login)) &&
      (!filters.verified || player.verified === true)
  )
  const players = rankPool.filter((player) => matchesPlayer(player, query))
  const remaining = players.length - search.limit
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
        {allPlayers.length > 0 ? <LeaderboardLead players={allPlayers} /> : null}
      </PageHeader>

      {allPlayers.length > 0 ? (
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
              <CountryFilterMenu players={allPlayers} />
              <LeaderboardFilters players={allPlayers} />
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
            <RarityFilterChips players={allPlayers} />
            <span className="text-sm text-muted-foreground">
              {players.length === allPlayers.length
                ? m.players_count({ count: players.length })
                : m.players_count_filtered({ shown: players.length, total: allPlayers.length })}
            </span>
          </div>
        </div>
      ) : null}

      {allPlayers.length === 0 ? (
        <EmptyLeaderboard />
      ) : players.length === 0 ? (
        <p className="surface px-4 py-8 text-center text-sm text-muted-foreground">
          {m.filter_empty()}
        </p>
      ) : (
        <>
          <LeaderboardTable players={players} rankPool={rankPool} limit={search.limit} />
          {remaining > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                onClick={() => update({ limit: search.limit + LEADERBOARD_PAGE_SIZE })}
              >
                {m.leaderboard_show_more({ count: Math.min(remaining, LEADERBOARD_PAGE_SIZE) })}
              </Button>
              <p className="text-xs text-muted-foreground">
                {m.leaderboard_shown({ shown: search.limit, total: players.length })}
              </p>
            </div>
          ) : null}
        </>
      )}
    </main>
  )
}
