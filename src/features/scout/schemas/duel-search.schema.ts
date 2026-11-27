import { z } from "zod"

import { usernameSchema } from "@/features/scout/schemas/player.schema"

/** Oyuncu sayfasındaki "Kapıştır" düğmesi ev sahibini önceden seçili gönderir. */
export const duelSearchSchema = z.object({
  left: usernameSchema.optional().catch(undefined),
  /** `?challenge=1`: the link came from a "challenge a friend" share, so the page greets the visitor. */
  challenge: z.literal(1).optional().catch(undefined)
})
