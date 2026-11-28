import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { LoginReturn } from "@/constants/account.constants"

import { logout, startGithubLogin } from "@/lib/auth.functions"
import { viewerKeys, viewerQueryOptions } from "@/lib/auth.queries"

import { getLocale } from "@/paraglide/runtime.js"

/** Giriş yapmış kişi; yalnızca arayüz içindir. Her yetki kontrolü sunucuda yeniden yapılır. */
export function useViewer() {
  return useQuery(viewerQueryOptions())
}

/** GitHub girişini başlatır; sunucunun verdiği yetkilendirme adresine gider. */
/** `returnTo` brings the person back to that page after sign-in instead of their profile. */
export function useStartGithubLogin(returnTo?: LoginReturn) {
  return useMutation({
    // Dönüşte aynı dilde açılsın diye sayfanın dili gönderilir.
    mutationFn: () => startGithubLogin({ data: { locale: getLocale(), returnTo } }),
    onSuccess: ({ url }) => {
      window.location.assign(url)
    }
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: viewerKeys.all })
  })
}
