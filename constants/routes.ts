export const ROUTES = {
  conciliacion: "/finanzas/conciliacion",
  accountState: "/finanzas/estado-cuenta",
  access: "/seguridad/accesos",
} as const;

export type RouteKey = keyof typeof ROUTES;
