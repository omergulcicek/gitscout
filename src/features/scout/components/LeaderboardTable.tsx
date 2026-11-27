import { useId } from "react"

import { Link } from "@tanstack/react-router"
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable
} from "@tanstack/react-table"
import type { SortingState } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cn } from "cn"

import { getLangParam } from "@/helpers/localized-url"

import { GithubStarIcon } from "@/features/scout/components/GithubStarIcon"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { VerifiedIcon } from "@/features/scout/components/VerifiedIcon"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { STAT_TIER_TEXT } from "@/features/scout/constants/stat-tier.constants"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { countryName, playerCountry } from "@/features/scout/helpers/player-country"
import { statLabel, statShort, titleText } from "@/features/scout/helpers/player-text"
import { statTier } from "@/features/scout/helpers/stat-tier"
import { useLeaderboardSearch } from "@/features/scout/hooks/use-leaderboard-search"
import {
  LEADERBOARD_SORT_KEYS,
  leaderboardSearchDefaults
} from "@/features/scout/schemas/leaderboard-search.schema"
import type { LeaderboardSearch } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ListPlayer, RankedPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text }
})

const helper = createColumnHelper<typeof features, RankedPlayer>()

const statColumns = STAT_ORDER.map((key) =>
  helper.accessor((player) => player.stats[key].value, {
    id: key,
    header: () => statShort(key),
    sortDescFirst: true,
    meta: { align: "center", label: () => statLabel(key) },
    cell: (info) => {
      const value = info.getValue()
      return <span className={cn("font-medium", STAT_TIER_TEXT[statTier(value)])}>{value}</span>
    }
  })
)

const columns = helper.columns([
  helper.display({
    id: "rank",
    header: "#",
    enableSorting: false,
    // Veri sunucudan genel puana göre sıralı gelir; sıra numarası tablo nasıl sıralanırsa sıralansın OVR sırasıdır.
    cell: ({ row }) => <RankCell rank={row.original.rank} />
  }),
  helper.accessor("name", {
    id: "name",
    header: () => m.col_player(),
    sortFn: "text",
    cell: ({ row }) => <PlayerCell player={row.original} />
  }),
  // İsmin hemen yanında: dar ekranda tablo yana kaymadan genel puan görünsün.
  // Tam sayı puan gösterilir ama ondalıklı puana göre sıralanır; eşitlikte alfabe değil puan karar verir.
  helper.accessor((player) => player.ovrExact, {
    id: "ovr",
    header: () => m.col_ovr(),
    sortDescFirst: true,
    meta: { align: "center", label: () => m.col_ovr_label() },
    cell: ({ row }) => <RarityChip ovr={row.original.ovr} rarity={row.original.rarity} />
  }),
  helper.accessor("position", {
    id: "position",
    header: () => m.col_position(),
    sortFn: "text",
    cell: (info) => (
      <span
        lang="en"
        data-role={info.getValue()}
        className="role-tint inline-flex h-5 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap"
      >
        {info.getValue()}
      </span>
    )
  }),
  ...statColumns
])

type ColumnMeta = { align?: "center"; label?: string }

/** Sütun etiketleri fonksiyon olarak saklanır; okunduğu anda geçerli dilde yazılır. */
function readMeta(meta: unknown): ColumnMeta {
  if (typeof meta !== "object" || meta === null) return {}
  const align = "align" in meta && meta.align === "center" ? "center" : undefined
  const read: unknown = "label" in meta ? meta.label : undefined
  const label = typeof read === "function" ? String(read()) : undefined
  return { align, label }
}

function isSortKey(id: string): id is LeaderboardSearch["sort"] {
  return LEADERBOARD_SORT_KEYS.some((key) => key === id)
}

/**
 * İlk üç sıra madalya metaliyle durur: altın, gümüş, bronz. Renk yalnızca sıra rozetinde; satırdaki kart
 * türü (ör. İkon) aynen kalır, gümüş madalya bir İkon kartı gümüşe çevirmez.
 */
const MEDALS = { 1: "gold", 2: "silver", 3: "bronze" } as const

function RankCell({ rank }: { rank: number }) {
  const medal = rank === 1 || rank === 2 || rank === 3 ? MEDALS[rank] : undefined
  // Madalyasız sıralar da madalya genişliğinde bir kutuda ortalanır; rakamlar tek bir dikey eksende hizalanır.
  if (!medal) return <span className="inline-grid h-7 min-w-7 place-items-center">{rank}</span>
  return <RankMedal rank={rank} medal={medal} />
}

/** Kurdeleli, üzerinde sıra yazan madalya; renkler kartlarla aynı nadirlik değişkenlerinden gelir. */
function RankMedal({ rank, medal }: { rank: number; medal: (typeof MEDALS)[1 | 2 | 3] }) {
  // Her madalyanın degradesi kendi kimliğiyle; aynı sayfadaki üç SVG birbirinin degradesini ezmez.
  const gradientId = useId()
  return (
    <span data-rarity={medal} className="inline-grid size-7 place-items-center">
      <span className="sr-only">{rank}</span>
      <svg aria-hidden viewBox="0 0 28 28" className="size-7 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--frame-1)" }} />
            <stop offset="55%" style={{ stopColor: "var(--bg-2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--frame-2)" }} />
          </linearGradient>
        </defs>
        <path d="M6 0h5l4 10h-5z" style={{ fill: "var(--frame-2)" }} />
        <path d="M22 0h-5l-4 10h5z" style={{ fill: "var(--frame-2)" }} opacity="0.7" />
        <circle
          cx="14"
          cy="18"
          r="9.5"
          fill={`url(#${gradientId})`}
          style={{ stroke: "var(--frame-2)" }}
          strokeWidth="1"
        />
        <circle
          cx="14"
          cy="18"
          r="7.25"
          fill="none"
          style={{ stroke: "var(--frame-1)" }}
          strokeOpacity="0.7"
          strokeWidth="0.75"
        />
        <text
          x="14"
          y="18.5"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[10px] font-bold"
          style={{ fill: "var(--card-ink)" }}
        >
          {rank}
        </text>
      </svg>
    </span>
  )
}

function PlayerCell({ player }: { player: ListPlayer }) {
  const country = playerCountry(player)
  const Flag = country ? COUNTRY_FLAGS[country] : undefined
  return (
    <Link
      to="/{-$lang}/u/$username"
      params={{ lang: getLangParam(), username: player.login }}
      className="flex items-center gap-3 rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <img
        src={player.avatarUrl}
        alt=""
        width={36}
        height={36}
        className="size-9 rounded-full bg-muted outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 truncate font-medium text-foreground">{player.name}</span>
          {player.verified && <VerifiedIcon />}
          {isGithubStar(player.login) && <GithubStarIcon />}
          {country && Flag ? (
            <Flag
              role="img"
              aria-label={countryName(country)}
              title={countryName(country)}
              className={FLAG_CLASS}
            />
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          @{player.login} · {titleText(player.title)}
        </span>
      </span>
    </Link>
  )
}

type LeaderboardTableProps = {
  /** Rows with their rank already set; the rank stays the OVR rank whatever column the table is sorted by. */
  players: RankedPlayer[]
  /** Rows arrive sorted by the server; the table only shows the sort state and writes clicks to the URL. */
  manualSorting?: boolean
}

export function LeaderboardTable({ players, manualSorting = false }: LeaderboardTableProps) {
  const { search, update } = useLeaderboardSearch()
  const sorting: SortingState = [{ id: search.sort, desc: search.dir === "desc" }]

  const table = useTable({
    features,
    columns,
    data: players,
    state: { sorting },
    manualSorting,
    // Sıralama hiç kalkmasın: üçüncü tıklamada boş tablo yerine yön değişir.
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      const first = next[0]
      const sort = first && isSortKey(first.id) ? first.id : leaderboardSearchDefaults.sort
      update({ sort, dir: first?.desc === false ? "asc" : "desc" })
    }
  })

  return (
    // Dar ekranda tablo kendi kutusunda yana kayar. Geniş ekranda sığdığı için taşma kapatılır;
    // `overflow` açıkken başlık sayfaya değil kutuya yapışır ve kaydırınca kaybolur.
    // `relative`: içerideki `sr-only` metinler mutlak konumlu; kapsayıcı olmazsa kaydırma kutusundan
    // taşıp mobilde sayfayı yana genişletir.
    <div className="surface relative overflow-x-auto lg:overflow-visible">
      <table className="w-full min-w-180 text-sm">
        <caption className="sr-only">{m.table_caption()}</caption>
        <thead className="text-xs text-muted-foreground uppercase lg:sticky lg:top-0 lg:z-10">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const { align, label } = readMeta(header.column.columnDef.meta)
                const sorted = header.column.getIsSorted()
                const canSort = header.column.getCanSort()
                const SortIcon =
                  sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                    className={cn(
                      // Yapışan başlığın altından satırlar geçer; zemin opak olmalı. Köşeler kutuyla aynı yuvarlaklıkta.
                      "border-b bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] first:rounded-tl-xl last:rounded-tr-xl",
                      align === "center"
                        ? "px-1 py-2 text-center font-medium"
                        : "px-3 py-2 text-left font-medium"
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        title={label ? m.sort_by({ label }) : undefined}
                        className={
                          sorted
                            ? "inline-flex min-h-6 items-center gap-1 rounded-sm text-foreground uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            : "inline-flex min-h-6 items-center gap-1 rounded-sm uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        }
                      >
                        <table.FlexRender header={header} />
                        <SortIcon
                          aria-hidden
                          className={sorted ? "size-3.5" : "size-3.5 opacity-40"}
                        />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.original.login}
              className="border-b transition-colors last:border-0 hover:bg-muted/40"
            >
              {row.getAllCells().map((cell) => {
                const { align } = readMeta(cell.column.columnDef.meta)
                const isRank = cell.column.id === "rank"
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      isRank
                        ? "w-12 px-3 py-3 font-mono text-muted-foreground tabular-nums"
                        : align === "center"
                          ? "px-1 py-3 text-center font-mono tabular-nums"
                          : "px-3 py-3",
                      // Uzun adlar kesilir; tablo yana kaydığında isim sütunu tüm alanı yutmaz. Linkin tıklama
                      // alanı hücreye bağlı: eski WebKit `tr` üzerindeki `relative`i yok sayar, satıra bağlı alan
                      // sayfaya taşıp ana sayfadaki input'u son satırın linkiyle kaplıyordu.
                      cell.column.id === "name" && "relative max-w-64"
                    )}
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
