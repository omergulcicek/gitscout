import * as m from "@/paraglide/messages.js"

const ERROR_MESSAGES = {
  "github:not-found": m.error_github_not_found,
  "github:rate-limit": m.error_github_rate_limit,
  "github:missing-token": m.error_github_token,
  "github:request": m.error_github_request,
  "limit:too-many-requests": m.error_too_many_requests,
  "limit:ip-lookups": m.error_ip_lookups
} as const satisfies Record<string, () => string>

const isKnownCode = (code: string): code is keyof typeof ERROR_MESSAGES => code in ERROR_MESSAGES

/** Sunucudan gelen hata kodunu kullanıcının dilinde bir cümleye çevirir. */
export function errorText(error: unknown): string {
  const code = error instanceof Error ? error.message : ""
  return isKnownCode(code) ? ERROR_MESSAGES[code]() : m.error_generic()
}
