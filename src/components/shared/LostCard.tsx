import { Ghost } from "lucide-react"

import * as m from "@/paraglide/messages.js"

const STAT_LABELS = [
  m.stat_short_act,
  m.stat_short_imp,
  m.stat_short_com,
  m.stat_short_rep,
  m.stat_short_con,
  m.stat_short_exp
] as const

type LostCardProps = {
  /** Shown where a player's name would be, e.g. "@octocat". */
  name: string
  /** The line under the name, where a player's title would be. */
  subtitle: string
}

/**
 * A gold card rated 404 for "not found" pages. It mirrors the player card's look with the shared
 * `scout-card` styles but stays decorative, so it doesn't need a real player.
 */
export function LostCard({ name, subtitle }: LostCardProps) {
  return (
    // Same rarity scope and glow as a player card on its own page; smaller on phones so the form stays close.
    <div aria-hidden data-rarity="gold" className="relative flex justify-center max-md:[zoom:0.8]">
      <div className="scout-card-glow pointer-events-none absolute -inset-8" />
      <figure
        data-rarity="gold"
        className="lost-card scout-card relative flex h-120 w-80 shrink-0 flex-col overflow-hidden rounded-[28px] p-2 max-[351px]:[zoom:0.9]"
      >
        <div className="scout-card-inner relative flex min-h-0 flex-1 flex-col rounded-[20px] px-5 pt-5 pb-4">
          <div className="scout-card-texture pointer-events-none absolute inset-0 rounded-[20px]" />

          <div className="relative flex items-start justify-between">
            <div className="flex flex-col">
              <span className="scout-card-accent font-mono text-6xl leading-none font-bold tracking-tighter tabular-nums">
                404
              </span>
              <span className="mt-1.5 text-xs font-semibold tracking-widest uppercase">???</span>
            </div>
            <span className="scout-card-chip rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
              {m.lost_card_chip()}
            </span>
          </div>

          <div className="relative mt-3 flex h-38 justify-center">
            <div className="scout-card-avatar grid aspect-square h-full place-items-center rounded-full">
              <Ghost className="scout-card-accent size-16" strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative mt-4 flex flex-col items-center text-center">
            <p className="line-clamp-2 text-xl leading-tight font-semibold text-balance break-all">
              {name}
            </p>
            <p className="scout-card-muted mt-1 line-clamp-1 text-xs">{subtitle}</p>
          </div>

          <div className="scout-card-rule relative mx-auto mt-4 w-full border-t" />

          {/* Stat row reads "· · 404 · ·": the number spans the two middle slots so it stays legible. */}
          <div className="relative mt-3 grid grid-cols-6 gap-x-1 gap-y-0.5 py-1">
            {STAT_LABELS.map((label, index) => (
              <span
                key={index}
                className="scout-card-muted text-center text-[10px] font-semibold tracking-wider"
              >
                {label()}
              </span>
            ))}
            <Dot />
            <Dot />
            <span className="scout-card-accent col-span-2 flex h-6 items-center justify-center font-mono text-xl leading-none font-bold tracking-widest tabular-nums">
              404
            </span>
            <Dot />
            <Dot />
          </div>

          <div className="relative mt-auto flex items-center pt-3 text-[11px]">
            <span lang="en" className="scout-card-muted font-semibold tracking-wide uppercase">
              Gitscout
            </span>
          </div>
        </div>
      </figure>
    </div>
  )
}

function Dot() {
  return (
    <span className="scout-card-accent flex h-6 items-center justify-center text-2xl leading-none">
      •
    </span>
  )
}
