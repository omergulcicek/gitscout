import { number, percent } from "@/features/scout/helpers/player-text"
import type { Benchmark, BenchmarkKey } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const LABELS: Record<BenchmarkKey, () => string> = {
  commits: m.compare_commits,
  activeDays: m.compare_active_days,
  longestStreak: m.compare_streak,
  stars: m.compare_stars,
  followers: m.compare_followers
}

type BenchmarksProps = {
  benchmarks: Benchmark[]
  /** Kayıtlı geliştirici sayısı (oyuncu dahil); başlıkta oyuncu hariç "diğer" sayısı gösterilir. */
  total: number
}

/** Oyuncunun her ölçüde diğer geliştiricilerin yüzde kaçının önünde olduğu; çubuk bu payı gösterir. */
export function Benchmarks({ benchmarks, total }: BenchmarksProps) {
  return (
    <section className="surface flex flex-col gap-3 p-4" aria-labelledby="compare-heading">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <h2 id="compare-heading" className="text-sm font-medium">
          {m.compare_title({ count: total - 1 })}
        </h2>
        <p className="text-xs text-balance text-muted-foreground">{m.compare_caption()}</p>
      </div>
      <ul className="grid gap-x-10 gap-y-3 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-3">
        {benchmarks.map((item) => (
          <BenchmarkRow key={item.key} item={item} />
        ))}
      </ul>
    </section>
  )
}

function aheadText(pct: number | null): string {
  if (pct === null) return m.compare_alone()
  if (pct >= 100) return m.compare_ahead_all()
  if (pct <= 0) return m.compare_behind_all()
  return m.compare_ahead({ pct })
}

function BenchmarkRow({ item }: { item: Benchmark }) {
  const pct = item.aheadShare === null ? null : Math.round(item.aheadShare * 100)
  // İki satır: etiket + değer, çubuk + yüzde. Geniş ekranda liste iki kolona bölünür, böylece sağ yarı da dolar.
  return (
    <li className="grid grid-cols-[1fr_3rem] items-center gap-x-3 gap-y-1.5 text-sm">
      <span className="text-muted-foreground">{LABELS[item.key]()}</span>
      <span className="text-end font-mono font-semibold tabular-nums">{number(item.value)}</span>
      {/* Görünen kısım çubuk ve yüzde; cümlenin tamamı ekran okuyucu için. */}
      <span aria-hidden className="h-1.5 rounded-full bg-muted">
        {pct === null ? null : (
          <span className="block h-full rounded-full bg-chart-home" style={{ width: `${pct}%` }} />
        )}
      </span>
      <span aria-hidden className="text-end font-mono text-xs text-muted-foreground tabular-nums">
        {pct === null ? "–" : percent(pct)}
      </span>
      <span className="sr-only">{aheadText(pct)}</span>
    </li>
  )
}
