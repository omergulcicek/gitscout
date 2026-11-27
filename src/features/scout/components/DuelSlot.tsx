import type { ReactNode } from "react"

import { cn } from "cn"

import { avatarSrc } from "@/helpers/avatar-src"

import { GithubMark } from "@/components/shared/GithubMark"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { PlayerCombobox } from "@/features/scout/components/PlayerCombobox"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import type { DuelSide } from "@/features/scout/helpers/duel"
import { statShort } from "@/features/scout/helpers/player-text"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type DuelSlotProps = {
  id: string
  /** Kapışma sayfasındaki gibi: sol taraf mavi, sağ taraf turuncu. */
  side: DuelSide
  label: string
  player: ListPlayer | null
  /** Logins the search leaves out (the other side). */
  exclude: readonly string[]
  onChange: (player: ListPlayer | null) => void
  autoFocus?: boolean
}

/**
 * Kapışmanın bir tarafı: üstte arama, altında kart. Geniş ekranda kapışma sayfasındaki köşeyle aynı
 * ölçüde ve aynı geçiş adıyla durur; iki taraf seçilince kart oradaki yerine kayarak geçer.
 * Boşken o tarafın renginde ters duran bir kart görünür; oyuncu seçilince kart dönüp yüzünü gösterir.
 */
export function DuelSlot({ id, side, label, player, exclude, onChange, autoFocus }: DuelSlotProps) {
  const isHome = side === "left"
  return (
    // `data-side`, kart arkasına tarafın rengini verir (`--side`).
    <div data-side={side} className="duel-side flex min-w-0 flex-col items-center gap-3">
      <div className="w-full max-w-80">
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider uppercase sm:text-xs",
            isHome ? "text-chart-home" : "text-chart-away"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              isHome ? "bg-chart-home" : "bg-chart-away",
              player === null && "duel-ready-dot"
            )}
          />
          {label}
        </label>
        {/* Geçiş adı yalnızca arama kutusunda: kapışma sayfasındaki kutuyla aynı ölçüde, ezilmeden kayar. */}
        <div
          className={
            isHome
              ? "lg:[view-transition-name:duel-picker-left]"
              : "lg:[view-transition-name:duel-picker-right]"
          }
        >
          <PlayerCombobox
            id={id}
            exclude={exclude}
            value={player}
            onChange={onChange}
            autoFocus={autoFocus}
            placeholder={m.duel_placeholder()}
            // Liste kutuya bağlı (`anchor`); bileşenin `data-chips` kuralı genişliği kutuya eşitlemesin.
            contentClassName="min-w-80 data-[chips=true]:min-w-80"
            inputClassName="w-full"
            align={side === "right" ? "end" : "start"}
          />
        </div>
      </div>

      {/* Geniş ekran: tam boy kart. Geçiş adı dıştaki kutuda; dönme ve süzülme içeride kalır, kutu kımıldamaz. */}
      <div
        className={cn(
          "max-lg:hidden",
          isHome
            ? "lg:[view-transition-name:duel-card-left]"
            : "lg:[view-transition-name:duel-card-right]"
        )}
      >
        <CardFlip
          side={side}
          className="h-120 w-80"
          front={player ? <PlayerCard player={player} /> : null}
          back={<CardBack inputId={id} side={side} />}
        />
      </div>

      {/* Dar ekran: küçük kart. */}
      <CardFlip
        side={side}
        className="h-40 w-full lg:hidden"
        front={player ? <MiniCard player={player} /> : null}
        back={<MiniCardBack inputId={id} />}
      />
    </div>
  )
}

type CardFlipProps = {
  side: DuelSide
  className: string
  front: ReactNode
  back: ReactNode
}

/** İki yüzlü kart: yüz verilince ters kart döner. İki taraf birbirine doğru değil, dışa doğru döner. */
function CardFlip({ side, className, front, back }: CardFlipProps) {
  return (
    <div
      data-flipped={front !== null}
      data-side={side}
      className={cn("duel-flip relative", className)}
    >
      <div className="duel-flip-inner relative size-full">
        <div className="duel-face absolute inset-0">{back}</div>
        <div className="duel-face duel-face-front absolute inset-0">{front}</div>
      </div>
    </div>
  )
}

/**
 * Tam boy kartın arkası: oyuncu kartıyla aynı iskelet (puan köşesi, fotoğraf yeri, stat satırı) ama
 * içi boş. Etiket olduğu için tıklayınca o tarafın arama kutusuna odaklanır.
 */
function CardBack({ inputId, side }: { inputId: string; side: DuelSide }) {
  return (
    <label
      htmlFor={inputId}
      className="duel-card-back group flex size-full cursor-pointer rounded-[28px] p-2"
    >
      <span
        aria-hidden
        className="duel-card-back-inner relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] px-5 pt-5 pb-4 text-white"
      >
        <span className="duel-card-back-texture pointer-events-none absolute inset-0 rounded-[20px]" />
        <span className="duel-card-back-shine pointer-events-none absolute inset-0 rounded-[20px]" />

        <span className="relative flex items-start justify-between">
          <span className="flex flex-col">
            <span className="duel-side-text font-mono text-6xl leading-none font-bold tracking-tighter">
              ??
            </span>
            <span className="mt-1.5 font-mono text-xs font-semibold tracking-widest text-white/60 uppercase">
              OVR
            </span>
          </span>
          <span className="duel-side-chip rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase">
            {side === "left" ? m.duel_home_short() : m.duel_away_short()}
          </span>
        </span>

        <span className="relative mt-3 flex h-38 justify-center">
          <span className="duel-avatar-slot flex aspect-square h-full items-center justify-center rounded-full">
            <GithubMark className="size-14 text-white/25 transition-transform duration-300 ease-(--ease-out) group-hover:scale-110" />
          </span>
        </span>

        <span className="relative mt-4 flex flex-col items-center text-center">
          <span className="text-xl leading-tight font-semibold">{m.duel_back_title()}</span>
          <span className="mt-1 text-xs text-white/55">{m.duel_back_hint()}</span>
        </span>

        <span className="relative mx-auto mt-4 w-full border-t border-white/15" />

        <span className="relative mt-3 grid grid-cols-6 gap-1">
          {STAT_ORDER.map((key) => (
            <span key={key} className="flex flex-col items-center gap-0.5 py-1">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-white/50">
                {statShort(key)}
              </span>
              <span className="font-mono text-xl leading-none font-bold text-white/20">–</span>
            </span>
          ))}
        </span>

        <span className="relative mt-auto flex items-center justify-between pt-3 font-mono text-[11px] font-semibold tracking-widest uppercase">
          <span lang="en" className="text-white/45">
            Gitscout
          </span>
          <span className="duel-side-text">{m.duel_title()}</span>
        </span>
      </span>
    </label>
  )
}

/** Dar ekranda kartın arkası: tarafın renginde çerçeve, ortada boş fotoğraf yeri. */
function MiniCardBack({ inputId }: { inputId: string }) {
  return (
    <label
      htmlFor={inputId}
      className="duel-card-back flex size-full cursor-pointer rounded-2xl p-1.5"
    >
      <span
        aria-hidden
        className="duel-card-back-inner relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl px-2 text-white"
      >
        <span className="duel-card-back-texture pointer-events-none absolute inset-0 rounded-xl" />
        <span className="duel-card-back-shine pointer-events-none absolute inset-0 rounded-xl" />
        <span className="duel-avatar-slot relative flex size-16 items-center justify-center rounded-full">
          <GithubMark className="size-7 text-white/25" />
        </span>
        <span className="relative line-clamp-1 text-center text-xs font-semibold text-white/80">
          {m.duel_back_title()}
        </span>
      </span>
    </label>
  )
}

/** Dar ekranda seçilen oyuncunun küçük kartı: kart türünün rengi, fotoğraf ve isim. */
function MiniCard({ player }: { player: ListPlayer }) {
  return (
    <div data-rarity={player.rarity} className="scout-card flex size-full rounded-2xl p-1.5">
      <div className="scout-card-inner flex w-full flex-col items-center justify-center gap-2 rounded-xl px-2">
        <img
          src={avatarSrc(player.avatarUrl, 64)}
          alt=""
          width={64}
          height={64}
          className="scout-card-avatar size-16 rounded-full bg-muted"
        />
        <span className="line-clamp-2 w-full text-center font-sans text-sm font-semibold break-words">
          {player.name}
        </span>
      </div>
    </div>
  )
}
