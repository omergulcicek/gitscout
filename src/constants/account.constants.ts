/**
 * Onaylı sayılmak ve profil ayarlarını değiştirebilmek için gereken en düşük GitHub hesabı koşulu.
 * Yeni açılmış sahte hesapları eler. Takipçi koşulu kaldırıldı: az takipçili gerçek geliştiricileri de
 * dışarıda bırakıyordu, onay işareti ise kimseye zarar verecek bir yetki tanımıyor.
 */
export const ACCOUNT_ELIGIBILITY = {
  minAgeMonths: 6
} as const

/** Uygulamanın kendi oturumu. Tarayıcıda yalnızca httpOnly çerezde rastgele bir anahtar durur. */
export const SESSION = {
  cookieName: "gs_session",
  maxAgeDays: 30
} as const

/**
 * Girişi başlatan sayfanın dili. GitHub dönüşü dilsiz `/auth/callback` adresine gelir; kişi aynı dilde
 * kalsın diye dil, giriş akışı süresince kısa ömürlü bir çerezde taşınır.
 */
export const LOGIN_LOCALE_COOKIE = {
  name: "gs_login_locale",
  maxAgeSeconds: 10 * 60
} as const

/**
 * Pages a sign-in can return to, by key. Only these fixed paths are ever used, so the return address
 * can't be turned into a redirect to somewhere else. Without one, sign-in lands on the player's profile.
 */
export const LOGIN_RETURNS = { season: "/season" } as const

export type LoginReturn = keyof typeof LOGIN_RETURNS

/** The page to return to after sign-in, carried through the GitHub round trip like the locale. */
export const LOGIN_RETURN_COOKIE = {
  name: "gs_login_return",
  maxAgeSeconds: 10 * 60
} as const

/** Ayarlarda seçilebilen cinsiyetler; boş bırakmak da mümkün. Herkese açık oyuncu verisine eklenmez. */
export const GENDERS = ["female", "male"] as const

export type Gender = (typeof GENDERS)[number]

/**
 * Onaylı hesabın profilde varsayılan gösterebileceği kalıcı kart yüzleri; boş bırakmak gerçek kart demek.
 * Takım kartı favori takım seçiliyken, GitHub Star kartı yalnızca GitHub Stars programındakilere açık.
 */
export const CARD_FACES = ["team", "github-star"] as const

export type CardFace = (typeof CARD_FACES)[number]
