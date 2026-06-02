export const routes = {
  landing: '/',
} as const

export type RouteKey = keyof typeof routes
