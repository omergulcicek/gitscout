import { LOGIN_RETURNS } from "@/constants/account.constants"

/**
 * The path a finished sign-in returns to, from the cookie the sign-in started with. Only keys of the
 * fixed list resolve; any other value (a URL, a path, an unknown key) gives undefined, so the cookie
 * can never send someone to an address of its own.
 */
export function loginReturnPath(value: string | undefined): string | undefined {
  return Object.entries(LOGIN_RETURNS).find(([key]) => key === value)?.[1]
}
