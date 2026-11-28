import { Link } from "@tanstack/react-router"
import { cn } from "cn"

import { getLangParam } from "@/helpers/localized-url"

import { AccountButton } from "@/components/shared/AccountButton"
import { GithubStarButton } from "@/components/shared/GithubStarButton"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { MobileMenu } from "@/components/shared/MobileMenu"
import * as m from "@/paraglide/messages.js"

const navLinkClass =
  "inline-flex min-h-6 items-center rounded-sm font-mono text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[status=active]:text-foreground site-nav-link"

export function SiteHeader() {
  const lang = getLangParam()

  return (
    <header>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          to="/{-$lang}"
          params={{ lang }}
          lang="en"
          className="rounded-sm font-mono text-sm font-bold tracking-wide uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-xl"
        >
          Gitscout
        </Link>
        <nav
          aria-label={m.nav_label()}
          className="flex items-center gap-3 min-[360px]:gap-4 sm:gap-5"
        >
          <Link to="/{-$lang}/leaderboard" params={{ lang }} className={navLinkClass}>
            {m.nav_leaderboard()}
          </Link>
          <Link to="/{-$lang}/vs" params={{ lang }} className={navLinkClass}>
            {m.nav_duel()}
          </Link>
          {/* Dar ekranda ana linkler görünür kalır; ikincil öğeler tek menüde toplanır. */}
          <Link
            to="/{-$lang}/about"
            params={{ lang }}
            className={cn(navLinkClass, "max-sm:hidden")}
          >
            {m.nav_about()}
          </Link>
          <div className="flex items-center gap-5 max-sm:hidden">
            <LanguageSwitcher />
            <GithubStarButton />
            <AccountButton />
          </div>
          <div className="sm:hidden">
            <MobileMenu />
          </div>
        </nav>
      </div>
    </header>
  )
}
