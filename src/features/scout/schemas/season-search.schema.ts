import { z } from "zod"

/** A past season on the season page (`?year=2026`); a missing or odd value shows the current season. */
export const seasonSearchSchema = z.object({
  year: z.coerce.number().int().min(2008).max(2100).optional().catch(undefined)
})
