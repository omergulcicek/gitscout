import type { CSSProperties, ReactNode, Ref } from "react"

import { cn } from "cn"

import { TEAMS } from "@/constants/team.constants"
import type { Team } from "@/constants/team.constants"

import { avatarSrc } from "@/helpers/avatar-src"

import { BadgeIcon } from "@/features/scout/components/BadgeIcon"
import { StatPips } from "@/features/scout/components/StatPips"
import { CARD_OCCASIONS } from "@/features/scout/constants/card-occasion.constants"
import { COUNTRY_FLAGS, FLAG_CLASS } from "@/features/scout/constants/country-flag.constants"
import { STAT_ORDER } from "@/features/scout/constants/scoring.constants"
import { TEAM_THEMES } from "@/features/scout/constants/team-theme.constants"
import { fitCardName } from "@/features/scout/helpers/card-name"
import { countryName, playerCountry } from "@/features/scout/helpers/player-country"
import {
  badgeName,
  clubLabel,
  rarityLabel,
  statShort,
  titleText
} from "@/features/scout/helpers/player-text"
import { statTier } from "@/features/scout/helpers/stat-tier"
import { BirthdayDecorations } from "@/features/scout/icons/BirthdayDecorations"
import { GithubStarDecorations } from "@/features/scout/icons/GithubStarDecorations"
import { HalloweenDecorations } from "@/features/scout/icons/HalloweenDecorations"
import { NewYearDecorations } from "@/features/scout/icons/NewYearDecorations"
import { ProgrammersDayDecorations } from "@/features/scout/icons/ProgrammersDayDecorations"
import { RepublicDayDecorations } from "@/features/scout/icons/RepublicDayDecorations"
import { TeamCrest } from "@/features/scout/icons/TeamCrest"
import { TeamDecorations } from "@/features/scout/icons/TeamDecorations"
import { VerifiedMark } from "@/features/scout/icons/VerifiedMark"
import { WomensDayDecorations } from "@/features/scout/icons/WomensDayDecorations"
import type { CardOccasion } from "@/features/scout/types/card-preview.types"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type PlayerCardProps = {
  player: ListPlayer
  ref?: Ref<HTMLElement>
  /**
   * Kutlama yüzü: kart türü etiketi yerine özel günün etiketi, kendi teması, süsleri ve unvan yerine
   * kutlama satırı. Puanı değiştirmez; doğum günü kartının 100 puanını çağıran verir.
   */
  occasion?: CardOccasion
}

/** Kutlama kartlarının boş alanlarına serpiştirilen süsler. Takım kartlarında süs yerine arma filigranı var. */
const DECORATIONS: Partial<Record<CardOccasion, () => ReactNode>> = {
  birthday: BirthdayDecorations,
  "womens-day": WomensDayDecorations,
  "programmers-day": ProgrammersDayDecorations,
  "republic-day": RepublicDayDecorations,
  halloween: HalloweenDecorations,
  "new-year": NewYearDecorations,
  "github-star": GithubStarDecorations
}

/** Takım kartının renkleri kartın CSS değişkenlerine yazılır; tema stil dosyasında `[data-team]` ile kurulur. */
function teamStyle(team: Team): CSSProperties {
  const theme = TEAM_THEMES[team]
  return {
    "--bg-1": theme.bg[0],
    "--bg-2": theme.bg[1],
    "--team-1": theme.stripes[0],
    "--team-2": theme.stripes[1],
    "--frame-1": theme.stripes[1],
    "--frame-2": theme.stripes[0],
    "--card-accent": theme.accent,
    "--card-line": theme.line
  }
}

/** Büyük harfe çevirirken i/İ doğru olsun: Türkçe karakter yoksa İngilizce kural. */
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/

export function PlayerCard({ player, ref, occasion }: PlayerCardProps) {
  const special = occasion ? CARD_OCCASIONS[occasion] : undefined
  const Decorations = occasion ? DECORATIONS[occasion] : undefined
  const country = playerCountry(player)
  const Flag = country ? COUNTRY_FLAGS[country] : undefined
  const team = TEAMS.find((item) => item === occasion)

  return (
    <figure
      ref={ref}
      data-rarity={player.rarity}
      data-occasion={occasion}
      data-team={team}
      data-team-tone={team ? TEAM_THEMES[team].tone : undefined}
      style={team ? teamStyle(team) : undefined}
      className="scout-card relative flex h-120 w-80 shrink-0 flex-col overflow-hidden rounded-[28px] p-2 max-[351px]:[zoom:0.9]"
    >
      <figcaption className="sr-only">
        {m.card_caption({
          name: player.name,
          ovr: player.ovr,
          position: player.position,
          title: titleText(player.title)
        })}
      </figcaption>

      {/* Finish on the frame (the Icon card's foil); the face sits above it. */}
      <div
        aria-hidden
        className="scout-card-foil pointer-events-none absolute inset-0 rounded-[28px]"
      />

      {/* İç çerçeve: dış radius = iç radius (20px) + padding (8px). */}
      <div className="scout-card-inner relative flex min-h-0 flex-1 flex-col rounded-[20px] px-5 pt-5 pb-4">
        <div
          aria-hidden
          className="scout-card-texture pointer-events-none absolute inset-0 rounded-[20px]"
        />
        {/* Rarity finish on the face: brushed silver, the Icon card's foil. Under the text. */}
        <div
          aria-hidden
          className="scout-card-finish pointer-events-none absolute inset-0 rounded-[20px]"
        />
        {Decorations ? <Decorations /> : null}
        {team ? <TeamDecorations team={team} /> : null}

        <div className="relative flex items-start justify-between">
          {/* Kart sabit yükseklikte: bayrak akışa girerse alt satır taşar. Avatarın kavisli köşesindeki boşluğa yerleşir. */}
          <div className="relative flex flex-col">
            <span className="scout-card-accent font-mono text-6xl leading-none font-bold tracking-tighter tabular-nums">
              {player.ovr}
            </span>
            <span lang="en" className="mt-1.5 text-xs font-semibold tracking-widest uppercase">
              {player.position}
            </span>
            {/* Cumhuriyet Bayramı kartı zaten bayrak renklerinde; ayrıca bayrak gösterilmez. */}
            {country && Flag && occasion !== "republic-day" ? (
              <Flag
                role="img"
                aria-label={countryName(country)}
                title={countryName(country)}
                className={cn(FLAG_CLASS, "absolute top-full left-0 mt-2 h-5")}
              />
            ) : null}
          </div>
          {/* Takım kartında etiketin yerinde arma; kulübün adı ekran okuyucuya alt metinle gider. */}
          {team && special ? (
            <TeamCrest
              team={team}
              alt={special.chip()}
              className="card-float-in size-16 shrink-0 drop-shadow-[0_2px_6px_rgb(0_0_0/0.35)]"
            />
          ) : special ? (
            <span className="scout-card-chip inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
              <special.icon aria-hidden className="size-3.5" />
              {special.chip()}
            </span>
          ) : (
            <span className="scout-card-chip rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase">
              {rarityLabel(player.rarity)}
            </span>
          )}
        </div>

        {/* The portrait keeps one size on every card (124px photo inside its ring); the name always has room for two lines. */}
        <div className="relative mt-3 flex h-33.5 shrink-0 justify-center">
          <img
            src={avatarSrc(player.avatarUrl, 152)}
            alt={m.avatar_alt({ name: player.name })}
            crossOrigin="anonymous"
            width={152}
            height={152}
            className="scout-card-portrait aspect-square h-full w-auto rounded-full object-cover"
          />
        </div>

        <div className="relative mt-4 flex flex-col items-center text-center">
          <div className="flex min-h-[2lh] items-center justify-center gap-1.5 text-xl leading-tight">
            <p
              lang={TURKISH_CHARS.test(player.name) ? "tr" : "en"}
              className="line-clamp-2 font-semibold text-balance"
            >
              {fitCardName(player.name, "full")}
            </p>
            {player.verified ? (
              <VerifiedMark size={18} color="var(--card-verified)" label={m.verified_label()} />
            ) : null}
          </div>
          {/* Doğum günü kartında unvanın yerini kutlama alır: kartın ne olduğunu tek bakışta söyler. */}
          {special ? (
            <p className="scout-card-accent mt-1 line-clamp-1 text-xs font-semibold">
              {special.wish()}
            </p>
          ) : (
            <p className="scout-card-muted mt-1 line-clamp-1 text-xs">{titleText(player.title)}</p>
          )}
        </div>

        <div aria-hidden className="scout-card-rule relative mx-auto mt-4 w-full border-t" />

        <dl className="relative mt-3 grid grid-cols-6 gap-1">
          {STAT_ORDER.map((key) => {
            const stat = player.stats[key]
            return (
              <div key={key} className="flex flex-col items-center gap-1 py-0.5">
                <dt className="scout-card-muted text-[10px] font-semibold tracking-wider">
                  {statShort(key)}
                </dt>
                <dd
                  className={cn(
                    "font-mono text-xl leading-none font-bold tabular-nums",
                    statTier(stat.value) === "elite" && "scout-card-accent"
                  )}
                >
                  {stat.value}
                </dd>
                <StatPips value={stat.value} />
              </div>
            )
          })}
        </dl>

        <div className="relative mt-auto flex items-center justify-between pt-3 text-[11px]">
          <span
            data-card-club
            lang="en"
            className="scout-card-muted truncate font-semibold tracking-wide uppercase"
          >
            {clubLabel(player.club)}
          </span>
          {player.badges.length > 0 ? (
            <ul data-card-badges className="flex shrink-0 gap-1" aria-label={m.badges_heading()}>
              {player.badges.slice(0, 4).map((badge) => (
                <li
                  key={badge.id}
                  title={badgeName(badge.id)}
                  data-badge={badge.id}
                  className="badge-tint grid size-6 place-items-center rounded-full"
                >
                  <BadgeIcon id={badge.id} className="size-3.5" />
                  <span className="sr-only">{badgeName(badge.id)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {/* Light that follows the pointer on showcase cards; hidden at rest and in downloads. */}
        <div
          aria-hidden
          className="scout-card-glare pointer-events-none absolute inset-0 rounded-[20px]"
        />
      </div>
    </figure>
  )
}
