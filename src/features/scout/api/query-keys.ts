export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  home: () => [...playerKeys.all, "home"] as const,
  boards: () => [...playerKeys.all, "board"] as const,
  board: (params: object) => [...playerKeys.boards(), params] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (login: string) => [...playerKeys.details(), login.toLowerCase()] as const
}
