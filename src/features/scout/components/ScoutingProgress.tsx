import { Check, LoaderCircle } from "lucide-react"
import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"

import { Skeleton } from "@/components/ui/skeleton"
import type { ScoutingProfile } from "@/features/scout/types/add-player.types"
import * as m from "@/paraglide/messages.js"

/** Sunucudaki aşamalarla aynı sırada; son adım kartın kaydedilmesi. */
const STEPS = [
  { id: "profile", label: m.add_step_profile },
  { id: "repos", label: m.add_step_repos },
  { id: "activity", label: m.add_step_activity },
  { id: "score", label: m.add_step_score }
] as const

const SCOUTING_STEP_COUNT = STEPS.length

type ScoutingProgressProps = {
  /** Şu an süren adımın sırası (0'dan başlar). */
  step: number
  /** Profil adımı bitince gelir; o ana kadar yerini iskelet tutar. */
  profile: ScoutingProfile | null
}

/** Kart hazırlanırken formun altında görünen, sunucudan gelen gerçek adımları gösteren liste. */
export function ScoutingProgress({ step, profile }: ScoutingProgressProps) {
  return (
    // Liste yüksekliği sıfırdan açılır: hero dikeyde ortalı olduğu için ani bir yükseklik
    // başlığı ve inputu bir anda yukarı zıplatırdı; böylece yerlerine süzülerek kayarlar.
    // Formun boşluğu da açılışa dahil olsun diye `-mt-2` ile alınıp içeride `pt-2` olarak verilir.
    <div className="-mt-2 grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none starting:grid-rows-[0fr] starting:opacity-0">
      <div className="min-h-0 overflow-hidden">
        <div className="pt-2">
          <ScoutingCard step={step} profile={profile} />
        </div>
      </div>
    </div>
  )
}

function ScoutingCard({ step, profile }: ScoutingProgressProps) {
  const current = STEPS[step] ?? STEPS[0]

  return (
    // Kenar `ring` değil `border`: dıştaki `overflow-hidden` gölge olarak çizilen halkayı keserdi.
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      {/* Satır yüksekliği sabit: profil gelince alttaki liste kaymaz. */}
      <div className="flex h-9 items-center gap-3">
        {profile ? (
          <>
            <img
              src={avatarSrc(profile.avatarUrl, 36)}
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-full bg-muted outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">{profile.name ?? profile.login}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                @{profile.login}
              </span>
            </span>
          </>
        ) : (
          <>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-2.5 w-20" />
            </span>
          </>
        )}
        <span aria-hidden className="ms-auto font-mono text-xs text-muted-foreground tabular-nums">
          {step + 1}/{SCOUTING_STEP_COUNT}
        </span>
      </div>

      <p aria-live="polite" className="sr-only">
        {m.add_step_count({ current: step + 1, total: SCOUTING_STEP_COUNT })}: {current.label()}
      </p>

      <ol aria-hidden className="flex flex-col gap-2">
        {STEPS.map((item, index) => {
          const state = index < step ? "done" : index === step ? "active" : "pending"
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors duration-300",
                state === "pending" && "text-muted-foreground/60",
                state === "done" && "text-muted-foreground"
              )}
            >
              <span className="grid size-4 shrink-0 place-items-center">
                {state === "done" ? (
                  <Check className="size-4 text-primary" />
                ) : state === "active" ? (
                  <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {item.label()}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
