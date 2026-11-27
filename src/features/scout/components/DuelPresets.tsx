import { useState } from "react"
import type { ReactNode } from "react"

import { Link } from "@tanstack/react-router"
import { ChevronRight, Shuffle } from "lucide-react"
import { cn } from "cn"

import { getLangParam } from "@/helpers/localized-url"

import type { DuelPreset } from "@/features/scout/helpers/duel-presets"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { useDuelPresets } from "@/features/scout/hooks/use-duel-presets"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type PresetView = "tr" | "world"

/**
 * Popüler kapışmalar: aynı alan ve kart türünden eşleşmeler arasından iki tarafının profiline en çok
 * bakılan üçü. Tek tıkla kapışmayı açar.
 */
export function DuelPresets() {
  // Undefined is this hour's set, prefetched by the route; "shuffle" asks the server for a new random one.
  const [seed, setSeed] = useState<number | undefined>(undefined)
  const [selectedView, setSelectedView] = useState<PresetView>("tr")
  const { data } = useDuelPresets(seed)
  if (!data) return null

  // Like the home page's top 10: Türkiye by default in Turkish, the mixed list in English.
  const canSwitch = getLocale() === "tr" && data.tr.length > 0
  const view: PresetView = canSwitch ? selectedView : "world"
  const presets = data[view]
  if (presets.length === 0) return null

  const reshuffle = () => setSeed(Math.floor(Math.random() * 2 ** 31))

  return (
    <section
      className="mx-auto flex w-full max-w-[49rem] flex-col gap-3"
      aria-labelledby="duel-presets-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="duel-presets-heading" className="text-base font-semibold">
          {m.duel_presets_title()}
        </h2>
        <div className="flex items-center gap-1">
          {canSwitch ? (
            <div
              role="group"
              aria-label={m.duel_presets_switch_label()}
              className="flex items-center"
            >
              <TextButton pressed={view === "tr"} onClick={() => setSelectedView("tr")}>
                {m.home_top_tr()}
              </TextButton>
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
              <TextButton pressed={view === "world"} onClick={() => setSelectedView("world")}>
                {m.home_top_world()}
              </TextButton>
              <span aria-hidden className="ps-1 text-muted-foreground">
                ·
              </span>
            </div>
          ) : null}
          <TextButton onClick={reshuffle}>
            <Shuffle aria-hidden className="size-3.5" />
            {m.duel_presets_shuffle()}
          </TextButton>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {presets.map((preset) => (
          <li key={`${preset.left.login}-${preset.right.login}`} className="flex">
            <PresetRow preset={preset} />
          </li>
        ))}
      </ul>
    </section>
  )
}

type TextButtonProps = {
  /** Verilirse açma/kapama düğmesidir (`aria-pressed`). */
  pressed?: boolean
  onClick: () => void
  children: ReactNode
}

function TextButton({ pressed, onClick, children }: TextButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-sm px-1 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        pressed ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

/**
 * Maç kartı: iki taraf kendi renginde karşı karşıya, altında adlar ve genel puanlar. Üzerine gelince
 * iki fotoğraf birbirine doğru bir adım atar.
 */
function PresetRow({ preset: { left, right, rarity } }: { preset: DuelPreset }) {
  return (
    <Link
      to="/{-$lang}/vs/$left/$right"
      params={{ lang: getLangParam(), left: left.login, right: right.login }}
      // Seçim sayfasındaki gibi kartlar geçişle yerine kayar; veri, üzerine gelince yüklenir (defaultPreload).
      viewTransition
      state={(previous) => ({ ...previous, duelTransition: true })}
      aria-label={m.duel_presets_open({ left: left.name, right: right.name })}
      className="surface group flex w-full flex-col gap-3 p-4 transition-colors outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span aria-hidden className="flex items-center justify-between gap-2">
        {/* Kart türü, kartlardaki renginde küçük bir kutu ve adı. */}
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          <span
            data-rarity={rarity}
            className="scout-card size-2.5 shrink-0 rounded-[3px] shadow-none"
          />
          {rarityLabel(rarity)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </span>
      {/* İsim ve puan kendi avatarının altında ortalı; kenara yaslansa avatarla hizası kopar. */}
      <span
        aria-hidden
        className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3"
      >
        <PresetSide player={left} side="left" />
        <span className="flex h-12 items-center font-mono text-xs font-bold text-muted-foreground">
          VS
        </span>
        <PresetSide player={right} side="right" />
      </span>
    </Link>
  )
}

function PresetSide({ player, side }: { player: ListPlayer; side: "left" | "right" }) {
  const isHome = side === "left"
  return (
    <span className="flex min-w-0 flex-col items-center gap-2.5 text-center text-sm">
      <Avatar player={player} side={side} />
      <span className="flex w-full flex-col items-center">
        <span className="w-full truncate font-medium">{player.name}</span>
        <span
          className={cn(
            "font-mono text-xs font-bold tabular-nums",
            isHome ? "text-chart-home" : "text-chart-away"
          )}
        >
          {player.ovr}
        </span>
      </span>
    </span>
  )
}

function Avatar({ player, side }: { player: ListPlayer; side: "left" | "right" }) {
  const isHome = side === "left"
  return (
    <img
      src={player.avatarUrl}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      className={cn(
        "size-12 rounded-full bg-muted ring-2 ring-offset-2 ring-offset-card transition-transform duration-300 ease-(--ease-out)",
        isHome
          ? "ring-chart-home group-hover:translate-x-1"
          : "ring-chart-away group-hover:-translate-x-1"
      )}
    />
  )
}
