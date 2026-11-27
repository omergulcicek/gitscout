import {
  createRouter as createTanStackRouter,
  defaultParseSearch,
  defaultStringifySearch
} from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

import { getContext } from "./providers/root-provider"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Virgül sorgu dizesinde güvenli; kodlanmasın ki filtreler `?pos=frontend,backend` diye okunsun.
    stringifySearch: (search) => defaultStringifySearch(search).replace(/%2C/gi, ","),
    parseSearch: defaultParseSearch
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }

  interface HistoryState {
    /** Kapışma seçiminden geçişle gelindi: kartlar zaten yerine kayarak geldi, giriş animasyonu oynamaz. */
    duelTransition?: boolean
    /** The card was just created: the profile plays its reveal once. */
    cardReveal?: boolean
  }
}
