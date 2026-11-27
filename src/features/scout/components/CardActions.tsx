import { Link } from "@tanstack/react-router"
import { Download, Swords } from "lucide-react"
import { toast } from "sonner"

import { trackEvent } from "@/lib/analytics"
import { getLangParam } from "@/helpers/localized-url"

import { Button, buttonVariants } from "@/components/ui/button"
import type { ScoredPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type CardActionsProps = {
  player: ScoredPlayer
  onDownload: () => Promise<void>
  isDownloading: boolean
}

export function CardActions({ player, onDownload, isDownloading }: CardActionsProps) {
  const handleDownload = () => {
    onDownload()
      .then(() => trackEvent({ name: "card_downloaded", login: player.login }))
      .catch(() => {
        toast.error(m.download_failed())
      })
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="default" size="sm" onClick={handleDownload} disabled={isDownloading}>
        <Download aria-hidden />
        {isDownloading ? m.download_preparing() : m.download()}
      </Button>
      <Link
        to="/{-$lang}/vs"
        params={{ lang: getLangParam() }}
        search={{ left: player.login }}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Swords aria-hidden />
        {m.duel_button()}
      </Link>
    </div>
  )
}
