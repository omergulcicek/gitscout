import { UserPlus } from "lucide-react"
import { toast } from "sonner"

import { localizedUrl } from "@/helpers/localized-url"

import { Button } from "@/components/ui/button"
import type { CountryCode } from "@/features/scout/constants/player-country.constants"
import { countryName } from "@/features/scout/helpers/player-country"
import * as m from "@/paraglide/messages.js"
import { getLocale } from "@/paraglide/runtime.js"

type InviteButtonProps = {
  country: CountryCode
  /** The country page the invite links to; it shows how close the page is to opening. */
  slug: string
  variant?: "default" | "outline"
  className?: string
}

/** Shares an invite to the country's page: the system share sheet on phones, the clipboard elsewhere. */
export function InviteButton({ country, slug, variant = "outline", className }: InviteButtonProps) {
  const invite = () => {
    const url = localizedUrl(`/top/${slug}`, getLocale())
    const text = m.top_invite_text({ country: countryName(country) })
    if (typeof navigator.share === "function") {
      navigator.share({ text, url }).catch((error: unknown) => {
        // Closing the share sheet rejects too; only a real failure is worth a message.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.error(m.top_invite_failed())
        }
      })
      return
    }
    navigator.clipboard
      .writeText(`${text} ${url}`)
      .then(() => toast.success(m.top_invite_copied()))
      .catch(() => toast.error(m.top_invite_failed()))
  }

  return (
    <Button variant={variant} size="sm" className={className} onClick={invite}>
      <UserPlus aria-hidden />
      {m.top_invite()}
    </Button>
  )
}
