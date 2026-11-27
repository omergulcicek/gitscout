import { Link } from "@tanstack/react-router"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

import { getLangParam } from "@/helpers/localized-url"

import { GithubStarCta } from "@/components/shared/GithubStarCta"
import { buttonVariants } from "@/components/ui/button"
import { BadgeList } from "@/features/scout/components/BadgeList"
import { Benchmarks } from "@/features/scout/components/Benchmarks"
import { BirthdayConfetti } from "@/features/scout/components/BirthdayConfetti"
import { CardActions } from "@/features/scout/components/CardActions"
import { CountryLink } from "@/features/scout/components/CountryLink"
import { DreamTeamSection } from "@/features/scout/components/DreamTeamSection"
import { GetYourCard } from "@/features/scout/components/GetYourCard"
import { GithubStarBadge } from "@/features/scout/components/GithubStarBadge"
import { PlayerCard } from "@/features/scout/components/PlayerCard"
import { PlayerRank } from "@/features/scout/components/PlayerRank"
import { PositionBreakdown } from "@/features/scout/components/PositionBreakdown"
import { RevealConfetti } from "@/features/scout/components/RevealConfetti"
import { ScoutNote } from "@/features/scout/components/ScoutNote"
import { ShareTextSection } from "@/features/scout/components/ShareTextSection"
import { SimilarPlayers } from "@/features/scout/components/SimilarPlayers"
import { StatRadar } from "@/features/scout/components/StatRadar"
import { TopRepos } from "@/features/scout/components/TopRepos"
import { VerifiedIcon } from "@/features/scout/components/VerifiedIcon"
import { YearSummary } from "@/features/scout/components/YearSummary"
import { BIRTHDAY_OVR } from "@/features/scout/helpers/birthday"
import { isGithubStar } from "@/features/scout/helpers/github-star"
import { playerCountry } from "@/features/scout/helpers/player-country"
import { rarityLabel } from "@/features/scout/helpers/player-text"
import { isProgrammersDay } from "@/features/scout/helpers/programmers-day"
import { isHalloween, isNewYear, isRepublicDay } from "@/features/scout/helpers/special-days"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import { useCardReveal } from "@/features/scout/hooks/use-card-reveal"
import { useEasedCount } from "@/features/scout/hooks/use-eased-count"
import { usePlayer } from "@/features/scout/hooks/use-player"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

/** Rarities that get confetti when their card is first revealed. */
const CELEBRATED_RARITIES = new Set(["gold", "icon"])
/** The score starts counting once the card has finished turning. */
const REVEAL_COUNT_DELAY_MS = 900

/** Anchor for the share menu's "ready-made texts" item. */
const SHARE_TEXTS_ID = "share-texts"

type PlayerDetailProps = {
  username: string
}

export function PlayerDetail({ username }: PlayerDetailProps) {
  const { data: player } = usePlayer(username)
  // Özel gün kartları kendiliğinden gelir, ayarlardan seçilmez; o gün kalıcı kartın (takım ya da GitHub Star)
  // ve nadirliğin önüne geçer. Birden çok gün denk gelirse kişiye özel olan önce gelir: doğum günü, Kadınlar
  // Günü, sonra ülkeye özel gün. Geçiş sunulmaz: o gün yalnızca özel kart görünür.
  const now = new Date()
  const cardFace = player.cardFace ?? null
  const specialDay = player.birthdayToday
    ? "birthday"
    : player.womensDayToday
      ? "womens-day"
      : isRepublicDay(now) && playerCountry(player) === "TR"
        ? "republic-day"
        : isHalloween(now)
          ? "halloween"
          : isNewYear(now)
            ? "new-year"
            : isProgrammersDay(now)
              ? "programmers-day"
              : null
  const shownOccasion = specialDay ?? cardFace ?? undefined
  const birthday = shownOccasion === "birthday"
  const cardPlayer = birthday
    ? { ...player, ovr: BIRTHDAY_OVR, ovrExact: BIRTHDAY_OVR, rarity: "icon" as const }
    : player
  // Right after creation the card flips in, its score counts up and gold or better gets confetti.
  const revealing = useCardReveal()
  const revealOvr = useEasedCount(revealing ? cardPlayer.ovr : 0, { delay: REVEAL_COUNT_DELAY_MS })
  // Confetti waits for the real score to land, after the flip and the count.
  const revealDone = revealing && revealOvr === cardPlayer.ovr
  const { cardRef, download, isDownloading, copy, isCopying } = useCardDownload(
    shownOccasion ? `gitscout-${username}-${shownOccasion}` : `gitscout-${username}`
  )

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-x-clip px-4 pt-2 pb-20 outline-none sm:px-6"
    >
      <Link
        to="/{-$lang}/leaderboard"
        params={{ lang: getLangParam() }}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ms-2 w-fit ps-2"
        })}
      >
        <ArrowLeft aria-hidden />
        {m.back_to_leaderboard()}
      </Link>

      <div className="grid gap-6 md:grid-cols-[20rem_1fr] md:items-start">
        <aside className="flex flex-col items-center gap-4 md:sticky md:top-6">
          {birthday ? <BirthdayConfetti /> : null}
          <div
            data-rarity={cardPlayer.rarity}
            className="relative flex w-full max-w-80 justify-center"
          >
            {/* Inside the rarity scope so the pieces pick up the card's own frame colours. */}
            {revealDone && !birthday && CELEBRATED_RARITIES.has(cardPlayer.rarity) ? (
              <RevealConfetti />
            ) : null}
            <div
              aria-hidden
              className={cn(
                "scout-card-glow pointer-events-none absolute -inset-8",
                revealing && "card-reveal-glow"
              )}
            />
            <div className="card-lift relative">
              <div className={revealing ? "card-reveal" : undefined}>
                <PlayerCard
                  player={revealing ? { ...cardPlayer, ovr: revealOvr } : cardPlayer}
                  ref={cardRef}
                  occasion={shownOccasion}
                />
              </div>
            </div>
          </div>
          <PlayerRank ranking={player.ranking} position={player.position} />
          {isGithubStar(player.login) ? <GithubStarBadge login={player.login} /> : null}
          <CardActions
            player={player}
            onDownload={download}
            isDownloading={isDownloading}
            onCopyImage={copy}
            isCopying={isCopying}
            shareTextsId={SHARE_TEXTS_ID}
          />
          <GithubStarCta />
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1">
              <a
                href={`https://github.com/${player.login}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-6 items-center gap-0.5 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                @{player.login}
                <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only"> {m.github_profile()}</span>
              </a>
              {player.verified ? <VerifiedIcon /> : null}
            </span>
            <CountryLink player={player} />
            <span className="text-xs text-muted-foreground">
              {m.last_updated({
                date: new Intl.DateTimeFormat(getLocale(), { dateStyle: "medium" }).format(
                  new Date(player.fetchedAt)
                )
              })}
            </span>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          {/* Ad, unvan, mevki ve kulüp kartın üzerinde; başlık yalnızca ekran okuyucular için. */}
          <h1 className="sr-only">
            {m.player_heading({
              name: player.name,
              rarity: rarityLabel(player.rarity),
              ovr: player.ovr
            })}
          </h1>

          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">
              {m.stats_heading()}
            </h2>
            {/* Üstte radar ve repolar eşit yükseklikte; altındakiler tam genişlikte, içerik kadar uzar. */}
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <StatRadar stats={player.stats} />
                <TopRepos repos={player.topRepos} />
              </div>
              <div className="surface flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <ScoutNote archetype={player.archetype} stats={player.stats} />
                <YearSummary year={player.year} />
              </div>
              <PositionBreakdown position={player.position} breakdown={player.positionBreakdown} />
              <Benchmarks benchmarks={player.benchmarks} total={player.ranking.total} />
            </div>
          </section>

          <BadgeList badges={player.badges} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <SimilarPlayers login={player.login} players={player.similar} />
        <DreamTeamSection owner={player} players={player.dreamTeam} />
        <ShareTextSection id={SHARE_TEXTS_ID} player={player} />
        <GetYourCard />
      </div>
    </main>
  )
}
