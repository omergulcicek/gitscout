import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import {
  deleteCookie,
  getCookie,
  getRequestHeader,
  setCookie,
  setResponseHeader
} from "@tanstack/react-start/server"
import { z } from "zod"

import {
  LOGIN_LOCALE_COOKIE,
  LOGIN_RETURN_COOKIE,
  LOGIN_RETURNS
} from "@/constants/account.constants"
import type { LoginReturn } from "@/constants/account.constants"
import { siteConfig } from "@/config/site.config"

import { deleteSession, findViewer, sessionCookie } from "@/lib/session"
import type { Viewer } from "@/lib/session"
import { createGithubAuthorizeUrl, isGithubLoginConfigured } from "@/lib/supabase-auth"

import { locales } from "@/paraglide/runtime.js"

/** Tarayıcıya giden tek bilgi: başlıkta ve profilde gösterilecek kadarı. Kimlik numarası ve anahtar gitmez. */
export type PublicViewer = Omit<Viewer, "githubId">

/**
 * İsteğin oturumundaki kişi. Her yetki kontrolü bunu sunucuda çağırır; tarayıcıdan gelen hiçbir kimlik bilgisine güvenilmez.
 * `createServerOnlyFn`: veritabanı istemcisi tarayıcı paketine girmesin.
 */
export const getCurrentViewer = createServerOnlyFn(async (): Promise<Viewer | null> =>
  findViewer(getCookie(sessionCookie.name))
)

/** Başlıktaki hesap düğmesi için. Çerez yoksa veritabanına gidilmez. */
export const getViewer = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicViewer | null> => {
    // Kişiye özel yanıt hiçbir ara önbellekte tutulmamalı.
    setResponseHeader("Cache-Control", "private, no-store")
    const viewer = await getCurrentViewer()
    if (!viewer) return null
    const { githubId: _githubId, ...publicViewer } = viewer
    return publicViewer
  }
)

/**
 * GitHub girişini başlatır ve tarayıcının gideceği adresi döner. POST olduğu için CSRF ara katmanından geçer.
 * Geri dönüş adresi istekten değil sitenin kendi ayarından kurulur (Host başlığıyla yönlendirme yapılamasın).
 */
export const startGithubLogin = createServerFn({ method: "POST" })
  .validator(
    z.object({
      locale: z.enum(locales),
      returnTo: z.enum(Object.keys(LOGIN_RETURNS) as [LoginReturn]).optional()
    })
  )
  .handler(async ({ data }): Promise<{ url: string }> => {
    if (!isGithubLoginConfigured()) throw new Error("auth:not-configured")
    // A page to come back to rides along in its own short-lived cookie; a stale one is cleared.
    if (data.returnTo) {
      setCookie(LOGIN_RETURN_COOKIE.name, data.returnTo, {
        path: "/",
        httpOnly: true,
        secure: !import.meta.env.DEV,
        sameSite: "lax",
        maxAge: LOGIN_RETURN_COOKIE.maxAgeSeconds
      })
    } else {
      deleteCookie(LOGIN_RETURN_COOKIE.name, { path: "/" })
    }
    // Sunucu fonksiyonunun adresi dilsizdir; dil, girişi başlatan sayfadan gelir.
    setCookie(LOGIN_LOCALE_COOKIE.name, data.locale, {
      path: "/",
      httpOnly: true,
      secure: !import.meta.env.DEV,
      sameSite: "lax",
      maxAge: LOGIN_LOCALE_COOKIE.maxAgeSeconds
    })
    const redirectTo = new URL("/auth/callback", siteConfig.url).toString()
    try {
      const url = await createGithubAuthorizeUrl(
        getRequestHeader("cookie") ?? "",
        redirectTo,
        ({ name, value, options }) => setCookie(name, value, options)
      )
      return { url }
    } catch (error) {
      console.error("[auth] giriş başlatılamadı", error)
      throw new Error("auth:start-failed", { cause: error })
    }
  })

/** Oturumu veritabanından ve tarayıcıdan siler. */
export const logout = createServerFn({ method: "POST" }).handler(async (): Promise<void> => {
  await deleteSession(getCookie(sessionCookie.name))
  deleteCookie(sessionCookie.name, { path: sessionCookie.options.path })
})
