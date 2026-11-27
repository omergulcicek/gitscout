import { BadgeCheck, ListFilter, Star } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import { POSITIONS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type LeaderboardFiltersProps = {
  players: ListPlayer[]
}

/** Radyo grubunda "hepsi" seçeneğinin değeri; filtreyi kaldırır. */
const ALL = "all"

/** Öğenin odak stili alt öğelerin hepsini boyar; simge çizgileri beyaza dönmesin diye svg'nin rengini miras alırlar. */
const KEEP_ICON_COLOR = "focus:**:text-inherit"

/**
 * Mevki alt menüsü ile tek tıkla açılıp kapanan GitHub Star ve onaylı hesap filtreleri (kart türü ayrı
 * çiplerde); yalnızca tabloda gerçekten bulunan seçenekler listelenir.
 */
export function LeaderboardFilters({ players }: LeaderboardFiltersProps) {
  const { filters, setFilters } = useLeaderboardSearch()
  const positions = POSITIONS.filter((position) =>
    players.some((player) => player.position === position)
  )
  const hasStars = players.some((player) => isGithubStar(player.login))
  const hasVerified = players.some((player) => player.verified === true)
  const activeCount = filters.positions.length + (filters.star ? 1 : 0) + (filters.verified ? 1 : 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ListFilter aria-hidden />
        {m.filter_button()}
        {activeCount > 0 ? (
          <span className="rounded-sm bg-foreground px-1.5 text-xs text-background">
            {activeCount}
            <span className="sr-only"> {m.filter_selected()}</span>
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44 overscroll-contain">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{m.filter_position()}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={filters.positions[0] ?? ALL}
              onValueChange={(value) => {
                const position = positions.find((item) => item === value)
                setFilters({ positions: position ? [position] : [] })
              }}
            >
              <DropdownMenuRadioItem value={ALL}>{m.filter_all_positions()}</DropdownMenuRadioItem>
              {positions.map((position) => (
                <DropdownMenuRadioItem key={position} value={position} lang="en">
                  <span
                    aria-hidden
                    data-role={position}
                    className="role-fill size-2 rounded-full"
                  />
                  {position}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {hasStars || hasVerified ? <DropdownMenuSeparator /> : null}
        {hasStars ? (
          <DropdownMenuCheckboxItem
            className={KEEP_ICON_COLOR}
            checked={filters.star}
            onCheckedChange={(checked) => setFilters({ star: checked })}
          >
            <Star aria-hidden className="size-3.5 fill-github-star text-github-star!" />
            {m.github_star()}
          </DropdownMenuCheckboxItem>
        ) : null}
        {hasVerified ? (
          <DropdownMenuCheckboxItem
            className={KEEP_ICON_COLOR}
            checked={filters.verified}
            onCheckedChange={(checked) => setFilters({ verified: checked })}
          >
            <BadgeCheck aria-hidden className="size-3.5 text-verified!" />
            {m.filter_verified()}
          </DropdownMenuCheckboxItem>
        ) : null}
        {activeCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setFilters({ positions: [], star: false, verified: false })}
            >
              {m.filter_clear()}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
