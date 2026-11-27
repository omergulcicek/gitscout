import { z } from "zod"

import { locales } from "@/paraglide/runtime.js"

/** Hazır paylaşım metninin gideceği yer. */
export const sharePlatformSchema = z.enum(["linkedin", "x"])

export type SharePlatform = z.infer<typeof sharePlatformSchema>

/** Paylaşım kutusunun sekmeleri: iki hazır metin ve README rozeti. */
export const shareTabSchema = z.enum([...sharePlatformSchema.options, "readme"])

export type ShareTab = z.infer<typeof shareTabSchema>

/** Paylaşım metninin dili; sayfa dilinden bağımsız seçilir. */
export const shareLocaleSchema = z.enum(locales)

export type ShareLocale = z.infer<typeof shareLocaleSchema>
