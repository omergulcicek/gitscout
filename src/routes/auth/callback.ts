import { createFileRoute } from "@tanstack/react-router"
import { parseCookieHeader } from "@supabase/ssr"

import { LOGIN_LOCALE_COOKIE, LOGIN_RETURN_COOKIE } from "@/constants/account.constants"

import { createSession, sessionCookie } from "@/lib/session"
import { exchangeGithubCode, supabaseCookieNames } from "@/lib/supabase-auth"
import { localizedUrl } from "@/helpers/localized-url"
import { loginReturnPath } from "@/helpers/login-return"

import { syncGithubAccount } from "@/features/scout/api/sync-account.api"
import { baseLocale, locales } from "@/paraglide/runtime.js"

/** GitHub kodları bu uzunluğun altında; daha uzun girdi Supabase'e gönderilmeden reddedilir. */
const MAX_CODE_LENGTH = 512

/**
 * GitHub girişinin geri dönüşü. Kod sunucuda oturuma çevrilir, hesap GitHub'dan doğrulanıp kaydedilir ve
 * uygulamanın kendi httpOnly oturum çerezi yazılır. Supabase'in akış çerezleri her durumda silinir.
 * Yönlendirme hedefi sabit: dışarıdan gelen bir adrese yönlendirilmez. Girişi bir sayfa başlattıysa
 * (`LOGIN_RETURNS`) oraya, yoksa oyuncunun profiline dönülür.
 */
export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get("cookie") ?? ""
        const headers = new Headers({ "Cache-Control": "no-store" })
        for (const name of supabaseCookieNames(cookieHeader)) {
          headers.append("Set-Cookie", sessionCookie.serializeRemoval(name))
        }

        // Girişi başlatan sayfanın dili; çerez yoksa ya da geçersizse varsayılan dil.
        const localeCookie = parseCookieHeader(cookieHeader).find(
          (cookie) => cookie.name === LOGIN_LOCALE_COOKIE.name
        )?.value
        const locale = locales.find((item) => item === localeCookie) ?? baseLocale
        headers.append("Set-Cookie", sessionCookie.serializeRemoval(LOGIN_LOCALE_COOKIE.name))

        // The page that started the sign-in, as a key into a fixed list; anything else is ignored.
        const returnCookie = parseCookieHeader(cookieHeader).find(
          (cookie) => cookie.name === LOGIN_RETURN_COOKIE.name
        )?.value
        const returnPath = loginReturnPath(returnCookie)
        headers.append("Set-Cookie", sessionCookie.serializeRemoval(LOGIN_RETURN_COOKIE.name))

        const redirect = (path: string) => {
          headers.set("Location", localizedUrl(path, locale))
          return new Response(null, { status: 303, headers })
        }

        const code = new URL(request.url).searchParams.get("code")
        if (!code || code.length > MAX_CODE_LENGTH) return redirect("/login?error=failed")

        try {
          const identity = await exchangeGithubCode(cookieHeader, code)
          const account = await syncGithubAccount(identity)
          const token = await createSession(account.githubId)
          headers.append("Set-Cookie", sessionCookie.serialize(token))
          return redirect(returnPath ?? `/u/${account.login}`)
        } catch (error) {
          console.error("[auth] GitHub girişi tamamlanamadı", error)
          return redirect("/login?error=failed")
        }
      }
    }
  }
})
