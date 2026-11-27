import { Link } from "@tanstack/react-router"
import { IdCard, LogIn, LogOut, Settings } from "lucide-react"

import { avatarSrc } from "@/helpers/avatar-src"
import { getLangParam } from "@/helpers/localized-url"

import { useLogout, useViewer } from "@/hooks/use-viewer"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import * as m from "@/paraglide/messages.js"

const linkClass =
  "inline-flex min-h-6 items-center gap-1.5 rounded-sm font-mono text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[status=active]:text-foreground"

/**
 * Başlıktaki giriş düğmesi. Giriş isteğe bağlı: girişsiz kişi bilgilendirme sayfasına gider.
 * Giriş durumu ilk çizimden sonra gelir; o ana kadar yer tutucu görünür, başlık kaymaz.
 */
export function AccountButton() {
  const lang = getLangParam()
  const { data: viewer, isPending } = useViewer()
  const logout = useLogout()

  if (isPending) return <span aria-hidden className="size-6" />

  if (!viewer) {
    return (
      <Link to="/{-$lang}/login" params={{ lang }} className={linkClass}>
        <LogIn aria-hidden className="size-4" />
        <span className="max-sm:sr-only">{m.account_login()}</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={m.account_menu({ login: viewer.login })}
        className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full ring-1 ring-border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <img
          src={avatarSrc(viewer.avatarUrl, 28)}
          alt=""
          width={28}
          height={28}
          className="size-full"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-40">
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
