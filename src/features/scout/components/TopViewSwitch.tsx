import { Link } from "@tanstack/react-router"
import { cn } from "cn"

import * as m from "@/paraglide/messages.js"

export type TopView = "world" | "tr"

const itemClass =
  "inline-flex min-h-6 items-center rounded-sm px-1.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

type TopViewSwitchProps = {
  view: TopView
  /** Names the list the switch controls, for screen readers. */
  label: string
}

/** A "World · Türkiye" choice next to a list; the choice lives in the current page's URL as `?top=`. */
export function TopViewSwitch({ view, label }: TopViewSwitchProps) {
  const item = (target: TopView, text: string) =>
    // Seçili olan bağlantı değildir: iki bağlantı da aynı yola gittiği için yönlendirici ikisini de "aktif" sayar.
    view === target ? (
      <span aria-current="true" className={cn(itemClass, "font-semibold text-foreground")}>
        {text}
      </span>
    ) : (
      <Link
        to="."
        search={(prev) => ({ ...prev, top: target })}
        replace
        resetScroll={false}
        className={cn(itemClass, "text-muted-foreground hover:text-foreground")}
      >
        {text}
      </Link>
    )

  return (
    <nav aria-label={label} className="flex items-center">
      {item("world", m.home_top_world())}
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      {item("tr", m.home_top_tr())}
    </nav>
  )
}
