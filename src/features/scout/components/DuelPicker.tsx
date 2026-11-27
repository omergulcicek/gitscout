import { useState } from "react"

import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router"
import { Dices, Swords } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { getLangParam } from "@/helpers/localized-url"

import { Button } from "@/components/ui/button"
import { DuelPresets } from "@/features/scout/components/DuelPresets"
import { DuelSlot } from "@/features/scout/components/DuelSlot"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { statShort } from "@/features/scout/helpers/player-text"
import { usePlayersByLogin } from "@/features/scout/hooks/use-players-by-login"
import { usePrefetchPlayer } from "@/features/scout/hooks/use-prefetch-player"
import { useRandomPlayer } from "@/features/scout/hooks/use-random-player"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

const routeApi = getRouteApi("/{-$lang}/vs/")

const LEFT_ID = "duel-left"
const RIGHT_ID = "duel-right"

/**
 * Kapışma sayfasının boş hali: kapışma sayfasının iki köşesi, ters duran iki kart ve aralarında VS ile
 * altı raundun listesi. İki taraf seçilince kapışma açılır; kartlar view transition ile yerlerine kayar,
 * maç özeti ortada belirir.
 */
export function DuelPicker() {
  const search = routeApi.useSearch()
  // `?left=` comes from a profile's "Duel" button; the route loader prefetches that player.
  const { data: preselected } = usePlayersByLogin(search.left ? [search.left] : [])
  const randomPlayer = useRandomPlayer()
  const challenger = search.challenge === 1 ? (preselected?.[0] ?? null) : null
  const navigate = useNavigate()
  const router = useRouter()
  const prefetchPlayer = usePrefetchPlayer()
  const [isOpening, setIsOpening] = useState(false)
  const [left, setLeft] = useState<ListPlayer | null>(() => preselected?.[0] ?? null)
  const [right, setRight] = useState<ListPlayer | null>(null)

  const open = (nextLeft: ListPlayer | null, nextRight: ListPlayer | null) => {
    setLeft(nextLeft)
    setRight(nextRight)
    if (!nextLeft || !nextRight || nextLeft.login === nextRight.login) return false
    const target = {
      to: "/{-$lang}/vs/$left/$right",
      params: { lang: getLangParam(), left: nextLeft.login, right: nextRight.login }
    } as const
    // Veri hemen yüklenmeye başlar ama geçiş onu beklemez: kart çevrilir, açılan statlar kısa bir
    // süre okunur, sonra geçiş başlar. Sayfanın yükleyicisi aynı istekleri yeniden atmaz, yarım kalanı bekler. Yükleme hata
    // verse de sayfa açılır ve hatayı kendisi gösterir.
    setIsOpening(true)
    void router
      .preloadRoute(target)
      .catch((error: unknown) => console.error("Could not preload the duel", error))
    window.setTimeout(
      () =>
        void navigate({
          ...target,
          viewTransition: true,
          state: (previous) => ({ ...previous, duelTransition: true })
        }),
      flipDuration() + REVEAL_HOLD_MS
    )
    return true
  }

  const choose = (side: "left" | "right", player: ListPlayer | null) => {
    const nextLeft = side === "left" ? player : left
    const nextRight = side === "right" ? player : right
    if (player) prefetchPlayer(player.login)
    if (open(nextLeft, nextRight)) return
    // Rakip henüz seçilmediyse arama doğrudan öbür tarafa geçer.
    const missing = nextLeft ? (nextRight ? null : RIGHT_ID) : LEFT_ID
    if (player && missing) requestAnimationFrame(() => document.getElementById(missing)?.focus())
  }

  /** Fills the empty sides with random players from the server; a picked side stays. */
  const pickRandom = async () => {
    const draw = (except: ListPlayer | null) =>
      randomPlayer.mutateAsync(except ? [except.login] : [])
    try {
      const nextLeft = left ?? (await draw(right))
      const nextRight = right ?? (await draw(nextLeft))
      open(nextLeft, nextRight)
    } catch {
      toast.error(m.error_generic())
    }
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 overflow-x-clip px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      {/* A challenge link only swaps the heading: same page, the challenger already in the home corner. */}
      <PageHeader
        eyebrow={m.duel_title()}
        title={challenger ? m.challenge_title({ name: challenger.name }) : m.duel_lead()}
        align="center"
      >
        <p className="max-w-xl text-sm text-balance text-muted-foreground">
          {challenger ? m.challenge_lead() : m.duel_sublead()}
        </p>
      </PageHeader>

      <div className="relative isolate">
        {/* Sahne: iki tarafın arkasında hafif renk. Geçişte sayfayla birlikte söner. */}
        <div aria-hidden className="pointer-events-none absolute -inset-x-4 -inset-y-10 -z-10">
          <div className="duel-stage-glow absolute inset-0" />
          <div className="duel-stage-grid absolute inset-0" />
        </div>

        {/* Ortadaki sütun eski VS + boşluk kadar geniş: kartlar geçişten önce yine aynı yerde durur.
            Dar ekranda orta sütun yok: kılıcın yeri kartlara ve seçicilere kalır, düzen kapışma sayfasındaki
            iki sütunla aynıdır. */}
        <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[20rem_8rem_20rem] lg:justify-center lg:gap-4">
          <DuelSlot
            id={LEFT_ID}
            side="left"
            label={m.duel_home()}
            player={left}
            exclude={right ? [right.login] : []}
            onChange={(player) => choose("left", player)}
          />
          <div className="flex flex-col items-center gap-6 self-center max-lg:hidden lg:mt-12">
            <VsMark isOpening={isOpening} />
            <StatLadder left={left} right={right} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void pickRandom()}
              disabled={isOpening || randomPlayer.isPending}
            >
              <Dices aria-hidden />
              {m.duel_random()}
            </Button>
          </div>
          <DuelSlot
            id={RIGHT_ID}
            side="right"
            label={m.duel_away()}
            player={right}
            exclude={left ? [left.login] : []}
            onChange={(player) => choose("right", player)}
            autoFocus={left !== null}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void pickRandom()}
          disabled={isOpening || randomPlayer.isPending}
          className="lg:hidden"
        >
          <Dices aria-hidden />
          {m.duel_random()}
        </Button>
        <p className="text-center text-sm text-muted-foreground" aria-live="polite">
          {isOpening ? m.duel_preparing() : m.duel_missing()}
        </p>
      </div>

      <DuelPresets />
    </main>
  )
}

/** `.duel-flip-inner` geçişiyle aynı süre; azaltılmış harekette kart çevrilmediği için beklenmez. */
const FLIP_MS = 700

/** Kartlar açıldıktan sonra ortadaki stat karşılaştırması okunsun diye geçişten önce beklenen süre. */
const REVEAL_HOLD_MS = 1000

function flipDuration() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : FLIP_MS
}

/** Ortadaki çapraz kılıçlar: kapışmanın işareti. Açılırken nabız gibi atar. */
function VsMark({ isOpening }: { isOpening: boolean }) {
  return (
    <span aria-hidden className="flex size-20 items-center justify-center">
      <Swords
        strokeWidth={1.75}
        className={cn("size-14 text-foreground", isOpening && "animate-pulse")}
      />
    </span>
  )
}

/**
 * Altı raundun listesi: seçilen tarafın değerleri kendi renginde dolar, boş taraf soru işaretiyle
 * bekler. Kartlardaki statların tekrarı olduğu için ekran okuyucudan gizli.
 */
function StatLadder({ left, right }: { left: ListPlayer | null; right: ListPlayer | null }) {
  return (
    <ol aria-hidden className="w-full max-lg:hidden">
      {STAT_ORDER.map((key) => (
        <li
          key={key}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-dashed border-border py-1.5 font-mono text-xs last:border-b-0"
        >
          <span
            className={cn(
              "text-end font-bold tabular-nums",
              left ? "text-chart-home" : "text-muted-foreground/50"
            )}
          >
            {left ? left.stats[key].value : "?"}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
            {statShort(key)}
          </span>
          <span
            className={cn(
              "font-bold tabular-nums",
              right ? "text-chart-away" : "text-muted-foreground/50"
            )}
          >
            {right ? right.stats[key].value : "?"}
          </span>
        </li>
      ))}
    </ol>
  )
}
