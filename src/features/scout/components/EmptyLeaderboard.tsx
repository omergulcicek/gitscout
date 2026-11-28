import { Users } from "lucide-react"

import * as m from "@/paraglide/messages.js"

export function EmptyLeaderboard() {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Users aria-hidden className="size-6 text-muted-foreground" />
      <p className="font-medium">{m.empty_title()}</p>
      <p className="text-sm text-balance text-muted-foreground">{m.empty_description()}</p>
    </div>
  )
}
