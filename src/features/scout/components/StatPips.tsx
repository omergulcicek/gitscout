import { cn } from "cn"

import { STAT_PIP_COUNT, STAT_TIER_PIPS } from "@/features/scout/constants/stat-tier.constants"
import { statTier } from "@/features/scout/helpers/stat-tier"

/** Five short bars under a stat on the card: filled ones show its tier. Decorative; the value is read out. */
export function StatPips({ value }: { value: number }) {
  const filled = STAT_TIER_PIPS[statTier(value)]
  return (
    <span aria-hidden className="flex gap-0.5">
      {Array.from({ length: STAT_PIP_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn("h-0.75 w-1.5 rounded-full bg-current", index >= filled && "opacity-20")}
        />
      ))}
    </span>
  )
}
