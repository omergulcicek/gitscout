export const playerKeys = {
  all: ["players"] as const,
  home: () => [...playerKeys.all, "home"] as const,
  turkeyTop: () => [...playerKeys.all, "turkey-top"] as const,
  boards: () => [...playerKeys.all, "board"] as const,
  board: (params: object) => [...playerKeys.boards(), params] as const,
  search: (params: object) => [...playerKeys.all, "search", params] as const,
  byLogin: (logins: readonly string[]) => [...playerKeys.all, "by-login", logins] as const,
  presets: (seed: number | undefined) => [...playerKeys.all, "presets", seed ?? "hour"] as const,
  specialSample: () => [...playerKeys.all, "special-sample"] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (login: string) => [...playerKeys.details(), login.toLowerCase()] as const
}
