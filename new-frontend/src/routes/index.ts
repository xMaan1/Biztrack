export const routes = {
  home: '/',
} as const

export type RouteKey = keyof typeof routes
