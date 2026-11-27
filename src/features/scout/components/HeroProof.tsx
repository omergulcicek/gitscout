import type { RecentEntry } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const AVATAR_LIMIT = 5

type HeroProofProps = {
  recent: RecentEntry[]
  /** Everyone on the leaderboard. */
  total: number
  lastDayCount: number
}

/** Hero'nun altında "insanlar şu an kart basıyor" satırı: son eklenenlerin avatarları ve sayılar. */
export function HeroProof({ recent, total, lastDayCount }: HeroProofProps) {
  if (total === 0) return null

  const avatars = recent.slice(0, AVATAR_LIMIT).map((entry) => entry.player)

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {avatars.length > 0 ? (
        <ul aria-hidden className="flex shrink-0 -space-x-2">
          {avatars.map((player) => (
            <li key={player.login}>
              <img
                src={player.avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-full ring-2 ring-background"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <p className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-success ring-3 ring-success/20"
        />
        <span>
          {m.home_proof_total({ count: total })}
          {lastDayCount > 0 ? <> · {m.home_proof_day({ count: lastDayCount })}</> : null}
        </span>
      </p>
    </div>
  )
}
