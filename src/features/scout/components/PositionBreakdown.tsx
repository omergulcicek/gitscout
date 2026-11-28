import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import { LanguageIcon } from "@/features/scout/components/LanguageIcon"
import { percent } from "@/features/scout/helpers/player-text"
import { POSITION_SLUGS } from "@/features/scout/schemas/leaderboard-search.schema"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type PositionBreakdownProps = {
  position: ScoredPlayer["position"]
  breakdown: ScoredPlayer["positionBreakdown"]
}

const MAX_ROLES = 3
const MAX_LANGUAGES = 8
const share = (value: number) => percent(value * 100)

/** Mevkinin hangi alan ve dillerden çıktığını gösterir; tam genişlikte, diller sığdığı kadar etiket olarak dizilir. */
export function PositionBreakdown({ position, breakdown }: PositionBreakdownProps) {
  const roles = breakdown.roles.filter((role) => role.share >= 0.01).slice(0, MAX_ROLES)
  const languages = breakdown.languages
    .filter((language) => language.share >= 0.01)
    .slice(0, MAX_LANGUAGES)

  return (
    <section className="surface flex flex-col gap-4 p-4" aria-labelledby="position-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="position-heading" className="flex items-center gap-2 text-sm font-medium">
          {m.col_position()}
          <Link
            to="/{-$lang}/leaderboard"
            params={{ lang: getLangParam() }}
            search={{ pos: POSITION_SLUGS[position] }}
            lang="en"
            data-role={position}
            aria-label={m.rank_open_position({ position })}
            className="role-tint rounded-full px-2 py-0.5 text-xs outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {position}
          </Link>
        </h2>
        <p className="text-xs text-balance text-muted-foreground">
          {m.repo_count({ count: breakdown.repoCount })}
        </p>
      </div>

      {roles.length > 0 ? (
        <ul className="flex flex-wrap gap-x-8 gap-y-3" aria-label={m.position_roles()}>
          {roles.map((role) => (
            <li
              key={role.group}
              data-role={role.group}
              className="flex flex-1 basis-40 flex-col gap-1.5 text-sm"
            >
              <div className="flex justify-between">
                <span lang="en">{role.group}</span>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {share(role.share)}
                </span>
              </div>
              <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="role-fill block h-full rounded-full"
                  style={{ width: `${Math.round(role.share * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {languages.length > 0 ? (
        <ul className="flex flex-wrap gap-2 border-t pt-4" aria-label={m.position_languages()}>
          {languages.map((language) => (
            <li
              key={language.name}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
            >
              <LanguageIcon name={language.name} />
              <span lang="en" className="font-medium">
                {language.name}
              </span>
              <span className="font-mono text-muted-foreground tabular-nums">
                {share(language.share)}
                {/* Dar ekranda yalnızca yüzde görünür; repo sayısı ekran okuyucuda kalır. */}
                <span className="max-sm:sr-only">
                  {" · "}
                  {m.repo_count({ count: language.repos })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
