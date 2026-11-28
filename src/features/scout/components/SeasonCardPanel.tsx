import { useEffect, useRef } from "react"
import type { ComponentType, Ref } from "react"

import { ChevronDown, CreditCard, Download, RotateCcw } from "lucide-react"
import { cn } from "cn"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { SnowyCard } from "@/features/scout/components/SnowyCard"
import { useCardDownload } from "@/features/scout/hooks/use-card-download"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

/** One more thing to download from the menu, next to the card itself. */
export type SeasonDownload = {
  label: string
  icon: ComponentType<{ "aria-hidden"?: boolean }>
  onSelect: () => void
  busy: boolean
}

type SeasonCardPanelProps = {
  player: ListPlayer
  year: number
  /** While the pack is being opened: the card's place is kept, empty, for it to fly into. */
  waiting: boolean
  /** The card has just flown in: the glow fades in and the snow drops onto it. */
  arrived: boolean
  /** Move keyboard focus to the download menu, as the ceremony's dialog closes. */
  focusDownload: boolean
  /** The card's place on the page, measured by the ceremony. */
  slotRef: Ref<HTMLDivElement>
  /** The posters, offered in the same menu as the card. */
  downloads: SeasonDownload[]
  onReopen: () => void
}

/** The season card on the page, with one menu for its downloads and a way to open the pack again. */
export function SeasonCardPanel({
  player,
  year,
  waiting,
  arrived,
  focusDownload,
  slotRef,
  downloads,
  onReopen
}: SeasonCardPanelProps) {
  const { cardRef, download, isDownloading } = useCardDownload(`gitscout-${player.login}-${year}`)
  const menuRef = useRef<HTMLButtonElement>(null)
  const busy = isDownloading || downloads.some((item) => item.busy)

  useEffect(() => {
    if (!waiting && focusDownload) menuRef.current?.focus()
  }, [waiting, focusDownload])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        ref={slotRef}
        className={cn("flex h-120 w-80 max-w-full justify-center", waiting && "invisible")}
      >
        {waiting ? null : <SnowyCard player={player} ref={cardRef} reveal={arrived} />}
      </div>
      {waiting ? null : (
        <div className="grid w-full max-w-80 grid-cols-2 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              ref={menuRef}
              disabled={busy}
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              <Download aria-hidden />
              {busy ? m.download_preparing() : m.season_download()}
              <ChevronDown aria-hidden className="ms-auto opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-auto whitespace-nowrap">
              <DropdownMenuItem onClick={download}>
                <CreditCard aria-hidden />
                {m.season_download_card()}
              </DropdownMenuItem>
              {downloads.map((item) => (
                <DropdownMenuItem key={item.label} onClick={item.onSelect}>
                  <item.icon aria-hidden />
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="w-full" onClick={onReopen}>
            <RotateCcw aria-hidden />
            {m.season_ceremony_reopen()}
          </Button>
        </div>
      )}
    </div>
  )
}
