import { Link } from "@tanstack/react-router"
import { cn } from "cn"

import { siteConfig } from "@/config/site.config"

import { getLangParam } from "@/helpers/localized-url"

import { BuyMeACoffeeButton } from "@/components/shared/BuyMeACoffeeButton"
import { ViraStackMark } from "@/components/shared/ViraStackMark"
import * as m from "@/paraglide/messages.js"

const linkClass =
  "inline-flex min-h-6 items-center gap-1.5 rounded-sm align-middle underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"

const navLinkClass = cn(linkClass, "site-nav-link gap-0 data-[status=active]:text-foreground")

export function SiteFooter() {
  const lang = getLangParam()

  return (
    <footer className="border-t text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              to="/{-$lang}"
              params={{ lang }}
              lang="en"
              className="inline-flex items-center gap-2 self-start rounded-sm font-mono text-base font-bold tracking-wide text-foreground uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <img src="/logo.svg" alt="" width={24} height={24} className="size-6" />
              Gitscout
            </Link>
            <p className="max-w-xs text-pretty">{m.footer_tagline()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link to="/{-$lang}/top/turkey" params={{ lang }} className={navLinkClass}>
              {m.footer_top_turkey()}
            </Link>
            <Link to="/{-$lang}/special-cards" params={{ lang }} className={navLinkClass}>
              {m.nav_special_cards()}
            </Link>
            <Link to="/{-$lang}/about" params={{ lang }} className={navLinkClass}>
              {m.nav_about()}
            </Link>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              GitHub
              <span className="sr-only"> {m.new_tab()}</span>
            </a>
            <BuyMeACoffeeButton size="sm" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-5 text-xs">
          <p>
            {m.footer_made_by()}{" "}
            <a
              href="https://omergulcicek.com"
              target="_blank"
              rel="noreferrer"
              className={linkClass}
            >
              Ömer Gülçiçek
              <span className="sr-only"> {m.new_tab()}</span>
            </a>
          </p>
          {/* Dillerde sözcük sırası farklı: "Built with X" / "X ile geliştirildi". */}
          <p>
            {m.footer_built_before()}
            <a href="https://virastack.com" target="_blank" rel="noreferrer" className={linkClass}>
              <ViraStackMark />
              ViraStack Start
              <span className="sr-only"> {m.new_tab()}</span>
            </a>
            {m.footer_built_after()}
          </p>
        </div>
      </div>
    </footer>
  )
}
