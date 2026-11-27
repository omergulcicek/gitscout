import { useRef, useState } from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox"
import { RarityChip } from "@/features/scout/components/RarityChip"
import { usePlayerSearch } from "@/features/scout/hooks/use-player-search"
import { usernameSchema } from "@/features/scout/schemas/player.schema"
import type { ListPlayer } from "@/features/scout/types/player.types"
import * as m from "@/paraglide/messages.js"

type PlayerComboboxProps = {
  id: string
  /** Logins left out of the results, e.g. the other side of a duel. */
  exclude?: readonly string[]
  value: ListPlayer | null
  onChange: (player: ListPlayer | null) => void
  placeholder: string
  autoFocus?: boolean
  /** Listede olmayan geçerli bir kullanıcı adı yazılınca kartını çıkarma seçeneği gösterilir. */
  onCreate?: (username: string) => void
  isCreating?: boolean
  /** Açılan listenin ek sınıfları; dar alanlarda listeyi kutudan geniş tutmak için. */
  contentClassName?: string
  /** Arama kutusunun ek sınıfları (ör. daha yüksek bir kutu). */
  inputClassName?: string
  /** Liste kutudan genişse hangi kenara hizalansın; sağdaki seçicide `end`, liste ekrandan taşmasın. */
  align?: "start" | "end"
}

/** Searches registered players by name or login on the server, so the page never holds the full list. */
export function PlayerCombobox({
  id,
  exclude = [],
  value,
  onChange,
  placeholder,
  autoFocus = false,
  onCreate,
  isCreating = false,
  contentClassName,
  inputClassName,
  align = "start"
}: PlayerComboboxProps) {
  const [query, setQuery] = useState("")
  // Liste yalnızca yazı alanına değil, ok ve temizle butonlarıyla bütün kutuya hizalanır;
  // yoksa `end` hizasında kutunun sağ kenarından butonlar kadar içeride kalır.
  const anchorRef = useRef<HTMLDivElement>(null)
  const typed = usernameSchema.safeParse(query)
  const canCreate = onCreate !== undefined && typed.success
  // Once a player is picked the input shows their name; searching that would just return them again.
  const search = value && query === value.name ? "" : query
  const { data: results = [], isFetching } = usePlayerSearch(search, exclude)
  // The selected player stays among the items while nothing is typed, so the combobox can render it.
  // Once the user types, only matches show; otherwise auto-highlight would keep the old pick on Enter.
  const players =
    value && search === "" && !results.some((player) => player.login === value.login)
      ? [value, ...results]
      : results

  return (
    <Combobox
      items={players}
      onInputValueChange={setQuery}
      autoHighlight
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(player) => player.name}
      // Gizli form alanına bütün oyuncu verisi değil, yalnızca kullanıcı adı yazılsın.
      itemToStringValue={(player) => player.login}
      isItemEqualToValue={(a, b) => a.login === b.login}
      // The server already filtered; matching again here would hide results while the next ones load.
      filter={null}
    >
      {/* Ev sahibi önceden seçiliyse kullanıcı doğrudan rakibi aramaya başlar. */}
      <div ref={anchorRef}>
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          showClear
          autoFocus={autoFocus}
          className={inputClassName}
        />
      </div>
      <ComboboxContent anchor={anchorRef} align={align} className={contentClassName}>
        <ComboboxEmpty>
          {isFetching ? (
            m.search_loading()
          ) : canCreate ? (
            <button
              type="button"
              disabled={isCreating}
              onClick={() => onCreate(typed.data)}
              className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
            >
              {isCreating ? m.add_preparing() : m.duel_add_new({ username: typed.data })}
            </button>
          ) : (
            m.duel_no_match()
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(player: ListPlayer) => (
            <ComboboxItem key={player.login} value={player}>
              <img
                src={player.avatarUrl}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 rounded-full bg-muted outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{player.name}</span>
                <span className="truncate text-xs text-muted-foreground">@{player.login}</span>
              </span>
              <RarityChip ovr={player.ovr} rarity={player.rarity} size="sm" />
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
