export const ROUTES = {
  conciliacion: "/finanzas/conciliacion",
  // TODO: add other routes here
} as const;

export type RouteKey = keyof typeof ROUTES;
