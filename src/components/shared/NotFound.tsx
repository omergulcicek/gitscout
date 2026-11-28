import { Link } from "@tanstack/react-router"

import { getLangParam } from "@/helpers/localized-url"

import { LostCard } from "@/components/shared/LostCard"
import { Button } from "@/components/ui/button"
import * as m from "@/paraglide/messages.js"

export function NotFound() {
  const lang = getLangParam()
  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[auto_1fr] md:gap-16 md:py-24">
      {/* React 19 bu etiketi <head> içine taşır; 404 sayfaları dizine girmez. */}
      <meta name="robots" content="noindex" />
      <div className="flex justify-center">
        <LostCard name={m.lost_card_page_name()} subtitle={m.lost_card_page_subtitle()} />
      </div>
      <div className="flex flex-col gap-4">
        <p className="font-mono text-sm font-semibold tracking-widest text-muted-foreground">404</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
          {m.not_found_title()}
        </h1>
        <p className="max-w-lg font-mono text-sm leading-relaxed text-balance text-muted-foreground">
          {m.not_found_description()}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link to="/{-$lang}" params={{ lang }} />}>
            {m.go_home()}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/{-$lang}/leaderboard" params={{ lang }} />}
          >
            {m.leaderboard_title()}
          </Button>
        </div>
      </div>
    </div>
  )
}
