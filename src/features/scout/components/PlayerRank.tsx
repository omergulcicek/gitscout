import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import { POSITION_SLUGS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { PlayerRanking, ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type PlayerRankProps = {
  ranking: PlayerRanking
  position: ScoredPlayer["position"]
}

/** Sıralama oyunun en güçlü hissi: genel ve mevki sırası büyük rakamla, iki hücrede. */
export function PlayerRank({ ranking, position }: PlayerRankProps) {
  const format = new Intl.NumberFormat(getLocale())

  return (
    <div className="surface grid w-full max-w-80 grid-cols-2 divide-x text-center">
      <p className="sr-only">
        {m.ranking({
          overall: ranking.overall,
          total: ranking.total,
          position,
          inPosition: ranking.inPosition,
          positionTotal: ranking.positionTotal
        })}
      </p>
      <RankCell
        label={m.rank_overall()}
        rank={ranking.overall}
        total={format.format(ranking.total)}
        linkLabel={m.rank_open_overall()}
      />
      <RankCell
        label={position}
        lang="en"
        rank={ranking.inPosition}
        total={format.format(ranking.positionTotal)}
        linkLabel={m.rank_open_position({ position })}
        pos={POSITION_SLUGS[position]}
      />
    </div>
  )
}

type RankCellProps = {
  label: string
  rank: number
  total: string
  lang?: string
  /** Accessible name of the link; the numbers are already read out by the summary above. */
  linkLabel: string
  /** Opens the leaderboard filtered to this position. */
  pos?: string
}

/** Each cell opens the leaderboard it counts in: the full table, or the one filtered to the position. */
function RankCell({ label, rank, total, lang, linkLabel, pos }: RankCellProps) {
  return (
    <Link
      to="/{-$lang}/leaderboard"
      params={{ lang: getLangParam() }}
      search={pos ? { pos } : {}}
      aria-label={linkLabel}
      className="flex flex-col items-center gap-0.5 px-3 py-2.5 transition-colors outline-none first:rounded-s-xl last:rounded-e-xl hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span lang={lang} className="text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <span className="font-mono text-2xl leading-none font-semibold tabular-nums">
        #{rank}
        <span className="ms-1 text-xs font-normal text-muted-foreground">/ {total}</span>
      </span>
    </Link>
  )
}
