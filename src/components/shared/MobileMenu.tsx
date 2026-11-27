import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { IdCard, Info, Languages, LogIn, LogOut, Menu, Settings, Star } from "lucide-react"

import { siteConfig } from "@/config/site.config"

import { trackEvent } from "@/lib/analytics"
import { repoStarsQueryOptions } from "@/lib/repo-stars.queries"
import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { useLogout, useViewer } from "@/hooks/use-viewer"

import { GithubMark } from "@/components/shared/GithubMark"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import * as m from "@/paraglide/messages.js"
import { getLocale, setLocale } from "@/paraglide/runtime.js"

/**
 * Dar ekranda başlığın ikincil öğeleri: Hakkında, dil, GitHub ve hesap tek menüde toplanır;
 * ana linkler başlıkta görünür kalır. Giriş yapılmışsa tetik avatardır.
 */
export function MobileMenu() {
  const lang = getLangParam()
  const next = getLocale() === "tr" ? "en" : "tr"
  const { data: viewer } = useViewer()
  const { data: stars } = useQuery(repoStarsQueryOptions())
  const logout = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={viewer ? m.account_menu({ login: viewer.login }) : m.nav_more()}
        className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full text-muted-foreground ring-1 ring-border transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {viewer ? (
          <img
            src={avatarSrc(viewer.avatarUrl, 28)}
            alt=""
            width={28}
            height={28}
            className="size-full"
          />
        ) : (
          <Menu aria-hidden className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        <DropdownMenuItem render={<Link to="/{-$lang}/about" params={{ lang }} />}>
          <Info aria-hidden />
          {m.nav_about()}
        </DropdownMenuItem>
        <DropdownMenuItem lang={next} onClick={() => void setLocale(next)}>
          <Languages aria-hidden />
          {m.language_switch()}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent({ name: "github_star_clicked", placement: "header" })}
            />
          }
        >
          <GithubMark />
          {m.github_star_button()}
          {typeof stars === "number" ? (
            <span className="ms-auto inline-flex items-center gap-1 ps-3 font-mono text-xs text-muted-foreground tabular-nums">
              <Star aria-hidden className="size-3 fill-github-star text-github-star" />
              {stars.toLocaleString(getLocale())}
            </span>
          ) : null}
          <span className="sr-only"> {m.new_tab()}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {viewer ? (
          <>
            <DropdownMenuItem
              render={<Link to="/{-$lang}/u/$username" params={{ lang, username: viewer.login }} />}
            >
              <IdCard aria-hidden />
              {m.account_my_card()}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link to="/{-$lang}/settings" params={{ lang }} />}>
              <Settings aria-hidden />
              {m.account_settings()}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <LogOut aria-hidden />
              {m.account_logout()}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem render={<Link to="/{-$lang}/login" params={{ lang }} />}>
            <LogIn aria-hidden />
            {m.account_login()}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
