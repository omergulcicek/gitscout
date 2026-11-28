import { useState } from "react"

import { X } from "lucide-react"

import { avatarSrc } from "@/helpers/avatar-src"

import { Button } from "@/components/ui/button"
import { PlayerCombobox } from "@/features/scout/components/PlayerCombobox"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { DREAM_TEAM_SIZE } from "@/features/scout/constants/profile.constants"
import { usePlayersByLogin } from "@/features/scout/hooks/use-players-by-login"
import * as m from "@/paraglide/messages.js"

type DreamTeamFieldProps = {
  /** Seçilen kullanıcı adları, seçim sırasıyla. */
  value: readonly string[]
  onChange: (logins: string[]) => void
  /** Kişinin kendi kullanıcı adı; kendini seçemez. */
  ownLogin: string
  disabled?: boolean
}

/** Kayıtlı oyuncular arasından en fazla beş kişilik kadro. Seçim zorunlu değil. */
export function DreamTeamField({
  value,
  onChange,
  ownLogin,
  disabled = false
}: DreamTeamFieldProps) {
  const { data: picked = [] } = usePlayersByLogin(value)
  // Seçimden sonra arama kutusu boşalsın diye kutu yeniden kurulur.
  const [searchKey, setSearchKey] = useState(0)

  const own = ownLogin.toLowerCase()
  const byLogin = new Map(picked.map((player) => [player.login.toLowerCase(), player]))
  const full = value.length >= DREAM_TEAM_SIZE

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ol className="flex flex-col gap-1.5">
          {value.map((login, index) => {
            const player = byLogin.get(login)
            const name = player?.name ?? login
            return (
              <li
                key={login}
                className="flex items-center gap-3 rounded-md border bg-background py-1.5 ps-2 pe-1.5"
              >
                <span className="w-4 text-center font-mono text-xs text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                {player ? (
                  <img
                    src={avatarSrc(player.avatarUrl, 28)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0 rounded-full bg-muted outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                  />
                ) : null}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">@{login}</span>
                </span>
                {player ? <RarityChip ovr={player.ovr} rarity={player.rarity} size="sm" /> : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={m.dream_team_remove({ name })}
                  onClick={() => onChange(value.filter((item) => item !== login))}
                  className="size-8"
                >
                  <X aria-hidden />
                </Button>
              </li>
            )
          })}
        </ol>
      ) : null}

      {full ? (
        <p className="text-xs text-balance text-muted-foreground">{m.dream_team_full()}</p>
      ) : (
        // Arama kutusu formun içinde: Enter oyuncu seçer ya da hiçbir şey yapmaz, formu göndermez.
        // Kutunun kendi tuş işleyicisi önce çalıştığı için seçim bozulmaz.
        <div
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault()
          }}
        >
          <PlayerCombobox
            key={searchKey}
            id="dream-team-search"
            exclude={[own, ...value]}
            value={null}
            onChange={(player) => {
              if (!player) return
              onChange([...value, player.login.toLowerCase()])
              setSearchKey((key) => key + 1)
            }}
            placeholder={m.dream_team_add()}
          />
        </div>
      )}
    </div>
  )
}
