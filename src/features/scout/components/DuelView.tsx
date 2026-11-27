import type { ReactNode } from "react"

import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { ArrowLeftRight, ImageIcon, Link2, Share2 } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { trackEvent } from "@/lib/analytics"
import { getLangParam } from "@/helpers/localized-url"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { DuelRadar } from "@/features/scout/components/DuelRadar"
import { GetYourCard } from "@/features/scout/components/GetYourCard"
import { PageHeader } from "@/features/scout/components/PageHeader"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { PlayerCardMedium } from "@/features/scout/components/PlayerCardMedium"
import { PlayerCombobox } from "@/features/scout/components/PlayerCombobox"
import { SHARE_TARGETS } from "@/features/scout/constants/share.constants"
import { STAT_TIER_TEXT } from "@/features/scout/constants/stat-tier.constants"
import { computeDuel } from "@/features/scout/helpers/duel"
import type { Duel, DuelSide } from "@/features/scout/helpers/duel"
import { errorText } from "@/features/scout/helpers/error-text"
import { toListPlayer } from "@/features/scout/helpers/list-player"
import { number, statLabel } from "@/features/scout/helpers/player-text"
import { statTier } from "@/features/scout/helpers/stat-tier"
import { useAddPlayer } from "@/features/scout/hooks/use-add-player"
import { useCountUp } from "@/features/scout/hooks/use-count-up"
import { useImageCopy } from "@/features/scout/hooks/use-image-copy"
import { usePlayer } from "@/features/scout/hooks/use-player"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type DuelViewProps = {
  left: string
  right: string
}

export function DuelView({ left: leftLogin, right: rightLogin }: DuelViewProps) {
  const { data: left } = usePlayer(leftLogin)
  const { data: right } = usePlayer(rightLogin)
  const duel = computeDuel(left, right)
  const {
    ref: contentRef,
    copy,
    isCopying,
    excludeProps
  } = useImageCopy(`gitscout-${leftLogin}-vs-${rightLogin}`)
  const winner = duel.winner === "left" ? left : duel.winner === "right" ? right : null
  const navigate = useNavigate()
  const addPlayer = useAddPlayer()
  // Seçim sayfasından geçişle gelindiyse kartlar zaten yerine kaydı; giriş animasyonu ikinci kez oynamaz.
  const fromPicker = useLocation({ select: (location) => location.state.duelTransition === true })

  /** Bir tarafı değiştirir; diğer taraf yerinde kalır. */
  const replace = (side: DuelSide, login: string) => {
    void navigate({
      to: "/{-$lang}/vs/$left/$right",
      params: {
        lang: getLangParam(),
        left: side === "left" ? login : left.login,
        right: side === "right" ? login : right.login
      }
    })
  }

  /** Listede olmayan biri yazılırsa önce kartı çıkarılır, sonra kapışmaya alınır. */
  const createAndReplace = (side: DuelSide, username: string) => {
    addPlayer.mutate(username, {
      onSuccess: (player) => {
        trackEvent({ name: "card_requested", login: player.login })
        replace(side, player.login)
      },
      onError: (error) => toast.error(errorText(error))
    })
  }

  const picker = (side: DuelSide, idSuffix = "") => {
    const current = side === "left" ? left : right
    const other = side === "left" ? right : left
    return (
      <div {...excludeProps} className="w-full max-w-80">
        <PlayerCombobox
          id={`duel-${side}${idSuffix}`}
          exclude={[other.login]}
          value={toListPlayer(current)}
          onChange={(player) => {
            if (player && player.login !== current.login) replace(side, player.login)
          }}
          placeholder={m.duel_change_placeholder()}
          onCreate={(username) => createAndReplace(side, username)}
          isCreating={addPlayer.isPending}
          align={side === "right" ? "end" : "start"}
        />
      </div>
    )
  }

  const duelEvent = (via: "image" | "link" | "x") =>
    trackEvent({ name: "duel_shared", left: left.login, right: right.login, via })

  const copyImage = () => {
    duelEvent("image")
    copy()
      .then((result) => {
        if (result === "copied") toast.success(m.duel_image_copied())
        if (result === "downloaded") toast.success(m.duel_image_downloaded())
      })
      .catch(() => toast.error(m.duel_image_failed()))
  }

  const copyLink = () => {
    duelEvent("link")
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success(m.duel_link_copied()))
      .catch(() => toast.error(m.duel_link_failed()))
  }

  const shareOnX = () => {
    duelEvent("x")
    const x = SHARE_TARGETS[0]
    const score = {
      left: left.name,
      right: right.name,
      leftScore: duel.score.left,
      rightScore: duel.score.right
    }
    const text = winner
      ? m.duel_share_winner({ ...score, winner: winner.name })
      : m.duel_share_draw(score)
    window.open(x.buildUrl(window.location.href, text), "_blank", "noopener,noreferrer")
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      ref={contentRef}
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 overflow-x-clip px-4 pt-6 pb-20 outline-none sm:px-6"
    >
      {/* Mobilde isimler hem aramada hem kartlarda görünüyor: başlık skoru aşağı itmesin diye gizli,
          ama H1 olarak sayfada kalır (SEO ve ekran okuyucu). */}
      <PageHeader
        className="max-lg:sr-only"
        eyebrow={m.duel_title()}
        title={
          <>
            {left.name} <span className="text-muted-foreground">vs</span> {right.name}
          </>
        }
        align="center"
      />

      {/* Mobilde iki taraf sayfa başında yan yana: büyük kartlar yerine puan ve statları taşıyan orta kartlar. */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <MiniCorner player={left} picker={picker("left", "-mobile")} />
        <MiniCorner player={right} picker={picker("right", "-mobile")} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[20rem_1fr_20rem]">
        <DuelCorner
          player={left}
          isWinner={duel.winner === "left"}
          side="left"
          picker={picker("left")}
          animateIn={!fromPicker}
        />

        <section
          aria-label={m.duel_summary()}
          className="flex flex-col gap-6 lg:order-none lg:[view-transition-name:duel-middle]"
        >
          <Scoreboard
            key={`${left.login}-${right.login}`}
            duel={duel}
            winner={winner}
            leftOvr={left.ovrExact}
            rightOvr={right.ovrExact}
          />
          <DuelRadar left={left} right={right} />
          <Rounds duel={duel} />
          <Receipts left={left} right={right} />
          <div {...excludeProps} className="flex flex-wrap justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "default", size: "sm" })}>
                <Share2 aria-hidden />
                {m.share()}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-auto overscroll-contain whitespace-nowrap"
              >
                <DropdownMenuItem onClick={shareOnX}>
                  <Share2 aria-hidden />
                  {m.duel_share_x()}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyLink}>
                  <Link2 aria-hidden />
                  {m.duel_copy_link()}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyImage} disabled={isCopying}>
                  <ImageIcon aria-hidden />
                  {isCopying ? m.duel_copying_image() : m.duel_copy_image()}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/{-$lang}/vs/$left/$right"
              params={{ lang: getLangParam(), left: right.login, right: left.login }}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeftRight aria-hidden />
              {m.duel_swap()}
            </Link>
          </div>
        </section>

        <DuelCorner
          player={right}
          isWinner={duel.winner === "right"}
          side="right"
          picker={picker("right")}
          animateIn={!fromPicker}
        />
      </div>

      <div {...excludeProps}>
        <GetYourCard />
      </div>
    </main>
  )
}

type DuelCornerProps = {
  player: ListPlayer
  isWinner: boolean
  side: DuelSide
  /** Kartın üstündeki arama: bu tarafı başka bir geliştiriciyle değiştirir. */
  picker: ReactNode
  animateIn: boolean
}

function DuelCorner({ player, isWinner, side, picker, animateIn }: DuelCornerProps) {
  return (
    // Geniş ekranda kartlar yerinde kalır, ortadaki maç özeti kayar.
    <div
      className={cn(
        "flex-col items-center gap-3 max-lg:hidden lg:sticky lg:top-6 lg:flex",
        animateIn && (side === "left" ? "duel-enter-left" : "duel-enter-right")
      )}
    >
      {/* Geçiş adları seçim sayfasındaki köşelerle aynı: kartlar oradan buraya kayarak gelir. */}
      <div
        className={cn(
          "flex w-full justify-center",
          side === "left"
            ? "[view-transition-name:duel-picker-left]"
            : "[view-transition-name:duel-picker-right]"
        )}
      >
        {picker}
      </div>
      <Link
        to="/{-$lang}/u/$username"
        params={{ lang: getLangParam(), username: player.login }}
        aria-label={m.duel_open_card({ name: player.name })}
        className={cn(
          "card-lift flex w-full max-w-80 justify-center rounded-[28px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          side === "left"
            ? "[view-transition-name:duel-card-left]"
            : "[view-transition-name:duel-card-right]",
          !isWinner && "opacity-90"
        )}
      >
        <PlayerCard player={player} />
      </Link>
      <p className="text-sm text-muted-foreground">@{player.login}</p>
    </div>
  )
}

/** Mobil için küçük kart: kart türünün rengi, fotoğraf ve isim. */
function MiniCorner({ player, picker }: { player: ListPlayer; picker: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {picker}
      <Link
        to="/{-$lang}/u/$username"
        params={{ lang: getLangParam(), username: player.login }}
        aria-label={m.duel_open_card({ name: player.name })}
        className="rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <PlayerCardMedium player={player} />
      </Link>
    </div>
  )
}

type ScoreboardProps = {
  duel: Duel
  winner: ListPlayer | null
  leftOvr: number
  rightOvr: number
}

function Scoreboard({ duel, winner, leftOvr, rightOvr }: ScoreboardProps) {
  const left = useCountUp(duel.score.left)
  const right = useCountUp(duel.score.right)
  const done = left === duel.score.left && right === duel.score.right

  return (
    <div className="surface flex flex-col items-center gap-3 px-4 py-5 text-center">
      {/* Ekran okuyucu son skoru duyar; sayım yalnızca görsel. */}
      <p className="sr-only">{m.duel_score({ left: duel.score.left, right: duel.score.right })}</p>
      <p
        aria-hidden
        className="flex font-mono text-6xl leading-none font-semibold tracking-tight tabular-nums"
      >
        <span key={`left-${left}`} className="score-tick">
          {left}
        </span>
        <span className="px-3 text-muted-foreground">–</span>
        <span key={`right-${right}`} className="score-tick">
          {right}
        </span>
      </p>
      {/* Uzatmada önce eşit skor okunsun; sonra kazanan, ardından uzatmayı neyin kazandırdığı gelir. */}
      <p
        className={cn(
          "score-result max-w-full text-lg font-semibold text-balance break-words",
          done && "is-done",
          duel.decidedBy === "ovr" && "delay-700"
        )}
      >
        {winner ? m.duel_winner({ name: winner.name }) : m.duel_draw()}
      </p>
      {/* Karar veren ondalıklı genel puan; tam sayıları eşit olduğu için kartlarda görünmez. */}
      {duel.decidedBy === "ovr" ? (
        <p
          className={cn(
            "score-result -mt-2 font-mono text-sm text-balance text-muted-foreground tabular-nums delay-1300",
            done && "is-done"
          )}
        >
          {m.duel_overtime_note({ left: decimal(leftOvr), right: decimal(rightOvr) })}
        </p>
      ) : null}
    </div>
  )
}

/** Uzatma notundaki puan: her zaman iki ondalık, dile göre ayraçla (77,90 / 77.90). */
function decimal(value: number): string {
  return new Intl.NumberFormat(getLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function Rounds({ duel }: { duel: Duel }) {
  return (
    <ul className="surface flex flex-col gap-3 px-4 py-4" aria-label={m.duel_rounds()}>
      {duel.rounds.map((round) => (
        <li
          key={round.key}
          className="grid grid-cols-[2.5rem_1fr_6.5rem_1fr_2.5rem] items-center gap-2 text-sm"
        >
          <RoundValue value={round.left} wins={round.winner === "left"} align="left" />
          <RoundBar value={round.left} wins={round.winner === "left"} side="left" />
          <span className="text-center text-xs font-medium text-muted-foreground">
            {statLabel(round.key)}
            <span className="sr-only">
              {" "}
              (
              {round.winner === "left"
                ? m.duel_left_won()
                : round.winner === "right"
                  ? m.duel_right_won()
                  : m.duel_tied()}
              )
            </span>
          </span>
          <RoundBar value={round.right} wins={round.winner === "right"} side="right" />
          <RoundValue value={round.right} wins={round.winner === "right"} align="right" />
        </li>
      ))}
    </ul>
  )
}

function RoundValue({ value, wins, align }: { value: number; wins: boolean; align: DuelSide }) {
  return (
    <span
      className={cn(
        "font-mono text-base",
        align === "left" ? "text-left" : "text-right",
        wins ? "font-semibold" : "opacity-60",
        STAT_TIER_TEXT[statTier(value)]
      )}
    >
      {value}
    </span>
  )
}

function RoundBar({ value, wins, side }: { value: number; wins: boolean; side: DuelSide }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-1.5 overflow-hidden rounded-full bg-muted",
        side === "left" && "justify-end"
      )}
    >
      <span
        // Her taraf kendi oyuncu renginde; kaybeden tonu soluk kalır.
        className={cn(
          "h-full rounded-full",
          side === "left" ? "bg-chart-home" : "bg-chart-away",
          !wins && "opacity-35"
        )}
        style={{ width: `${value}%` }}
      />
    </span>
  )
}

function Receipts({ left, right }: { left: ListPlayer; right: ListPlayer }) {
  const rows = [
    { label: m.duel_row_commits(), left: left.year.commits, right: right.year.commits },
    { label: m.duel_row_prs(), left: left.year.prs, right: right.year.prs },
    { label: m.duel_row_reviews(), left: left.year.reviews, right: right.year.reviews },
    {
      label: m.duel_row_active_days(),
      left: left.year.activeDays,
      right: right.year.activeDays
    },
    { label: m.duel_row_stars(), left: left.career.stars, right: right.career.stars },
    { label: m.duel_row_followers(), left: left.career.followers, right: right.career.followers },
    {
      label: m.duel_row_contributions(),
      left: left.career.contributions,
      right: right.career.contributions
    }
  ]

  return (
    <div className="surface overflow-hidden">
      <h2 className="px-4 pt-4 pb-2 text-center text-sm font-medium">{m.duel_numbers()}</h2>
      <table className="w-full text-sm">
        <caption className="sr-only">
          {m.duel_numbers_caption({ left: left.name, right: right.name })}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{left.name}</th>
            <th scope="col">{m.duel_metric()}</th>
            <th scope="col">{right.name}</th>
          </tr>
        </thead>
        <tbody className="divide-y border-t">
          {rows.map((row) => (
            <tr key={row.label}>
              <td
                className={cn(
                  "w-1/4 px-4 py-2 font-mono",
                  row.left > row.right ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {number(row.left)}
              </td>
              <th
                scope="row"
                className="px-2 py-2 text-center text-xs font-normal text-muted-foreground"
              >
                {row.label}
              </th>
              <td
                className={cn(
                  "w-1/4 px-4 py-2 text-right font-mono",
                  row.right > row.left ? "font-semibold" : "text-muted-foreground"
                )}
              >
                {number(row.right)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
