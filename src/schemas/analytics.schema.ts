import { z } from "zod"

/** GitHub kullanıcı adı biçimi; harf farkını veritabanı fonksiyonu birleştirir. */
const LOGIN = "[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}"

/**
 * Sitenin sayfa yolları: isteğe bağlı dil öneki, ardından ana sayfa, liderlik, hakkında, kapışma ya da profil.
 * Sorgu dizesi hiç gönderilmez; listede olmayan yollar (404, rastgele istekler) kaydedilmez.
 */
const PAGE_PATH = new RegExp(
  `^(?=/)(?:/(?:tr|en))?(?:/(?:leaderboard|about|vs(?:/${LOGIN}/${LOGIN})?|u/${LOGIN}))?/?$`
)

export const pagePathSchema = z.string().max(2048).regex(PAGE_PATH)

// Only real GitHub logins; the database also drops events whose login isn't a registered player.
const login = z.string().regex(new RegExp(`^${LOGIN}$`))

/** Error codes a failed card request reports; anything else is sent as `other`. */
export const CARD_FAILURE_REASONS = [
  "github:not-found",
  "github:rate-limit",
  "github:missing-token",
  "github:request",
  "limit:too-many-requests",
  "limit:ip-lookups",
  "other"
] as const

/** Where a card was shared from: the card menu or a copied ready-made text. */
export const CARD_SHARE_TARGETS = [
  "native",
  "x",
  "linkedin",
  "link",
  "image",
  "copy_x",
  "copy_linkedin",
  "challenge"
] as const

/**
 * Sitenin özel olayları. Çerez ve kişisel veri yok; yalnızca zaten herkese açık GitHub kullanıcı adları,
 * hata kodları ve hangi butona basıldığı gider.
 */
export const analyticsEventSchema = z.discriminatedUnion("name", [
  z.object({ name: z.literal("card_requested"), login }),
  z.object({ name: z.literal("card_request_failed"), reason: z.enum(CARD_FAILURE_REASONS) }),
  z.object({ name: z.literal("card_downloaded"), login }),
  z.object({ name: z.literal("card_shared"), login, target: z.enum(CARD_SHARE_TARGETS) }),
  z.object({
    name: z.literal("duel_shared"),
    left: login,
    right: login,
    via: z.enum(["image", "link", "x"])
  }),
  z.object({
    name: z.literal("github_star_clicked"),
    placement: z.enum(["header", "hero", "card"])
  }),
  z.object({
    name: z.literal("readme_badge_copied"),
    login,
    via: z.enum(["prompt", "markdown"]),
    // Boy seçimi sonradan geldi; eski sekmelerden gelen olaylar boysuz kalabilir.
    size: z.enum(["mini", "medium", "full"]).optional(),
    locale: z.enum(["en", "tr"]).optional()
  })
])

export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>
