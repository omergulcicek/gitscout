import { useSyncExternalStore } from "react"

import { Link } from "@tanstack/react-router"
import { Download, FileText, ImageIcon, Link2, Share2, Smartphone, Swords } from "lucide-react"
import { toast } from "sonner"

import { trackEvent } from "@/lib/analytics"
import { getLangParam, localizedUrl } from "@/helpers/localized-url"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Linkedin } from "@/components/ui/svgs/linkedin"
import { X } from "@/components/ui/svgs/x"
import { XDark } from "@/components/ui/svgs/xDark"
import { shareText } from "@/features/scout/helpers/share-text"
import type { PlayerDetail } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type CardActionsProps = {
  player: PlayerDetail
  onDownload: () => Promise<void>
  isDownloading: boolean
  onCopyImage: () => Promise<"copied" | "downloaded" | "skipped">
  isCopying: boolean
  /** Id of the ready-made share texts section further down the page. */
  shareTextsId: string
}

const noop = () => () => {}

/** Whether the browser has a system share sheet; always false on the server so hydration matches. */
function useCanShareNatively() {
  return useSyncExternalStore(
    noop,
    () => typeof navigator.share === "function",
    () => false
  )
}

export function CardActions({
  player,
  onDownload,
  isDownloading,
  onCopyImage,
  isCopying,
  shareTextsId
}: CardActionsProps) {
  const canShareNatively = useCanShareNatively()
  const track = (target: string) => trackEvent({ name: "card_shared", login: player.login, target })

  const handleDownload = () => {
    onDownload()
      .then(() => trackEvent({ name: "card_downloaded", login: player.login }))
      .catch(() => {
        toast.error(m.download_failed())
      })
  }

  // The short X text already ends with the card's link, so no target adds the URL a second time.
  const text = () => shareText(player, "x", getLocale())
  // Canonical card URL: no query string, in the page's language.
  const cardUrl = () => localizedUrl(`/u/${player.login}`, getLocale())

  const openUrl = (target: string, url: string) => {
    track(target)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const shareOnX = () =>
    openUrl("x", `https://x.com/intent/post?${new URLSearchParams({ text: text() }).toString()}`)

  // LinkedIn only takes a URL; the card's OG image becomes the preview.
  const shareOnLinkedin = () =>
    openUrl(
      "linkedin",
      `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: cardUrl() }).toString()}`
    )

  const shareNatively = () => {
    track("native")
    navigator.share({ text: text() }).catch((error: unknown) => {
      // Closing the share sheet rejects with AbortError; that's the user's choice, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return
      toast.error(m.share_failed())
    })
  }

  const copyLink = () => {
    track("link")
    navigator.clipboard
      .writeText(cardUrl())
      .then(() => toast.success(m.duel_link_copied()))
      .catch(() => toast.error(m.duel_link_failed()))
  }

  const copyImage = () => {
    track("image")
    onCopyImage()
      .then((result) => {
        if (result === "copied") toast.success(m.card_copied())
        if (result === "downloaded") toast.success(m.duel_image_downloaded())
      })
      .catch(() => toast.error(m.duel_image_failed()))
  }

  const showTexts = () => {
    document.getElementById(shareTextsId)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="default" size="sm" onClick={handleDownload} disabled={isDownloading}>
        <Download aria-hidden />
        {isDownloading ? m.download_preparing() : m.download()}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Share2 aria-hidden />
          {m.share()}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-auto overscroll-contain whitespace-nowrap">
          {canShareNatively ? (
            <>
              <DropdownMenuItem onClick={shareNatively}>
                <Smartphone aria-hidden />
                {m.share_native()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem onClick={shareOnX}>
            <X aria-hidden className="dark:hidden" />
            <XDark aria-hidden className="hidden dark:block" />
            {m.share_on_x()}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareOnLinkedin}>
            <Linkedin aria-hidden />
            {m.share_on_linkedin()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyLink}>
            <Link2 aria-hidden />
            {m.duel_copy_link()}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyImage} disabled={isCopying}>
            <ImageIcon aria-hidden />
            {isCopying ? m.duel_copying_image() : m.duel_copy_image()}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={showTexts}>
            <FileText aria-hidden />
            {m.share_ready_texts()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
