# Permissions Layer

This folder provides a unified permissions layer for the dashboard. The
`PermissionsProvider` fetches view and action permissions from the API and
exposes helpers through React context. Use `hasView` to guard routes and
`can` to enable or disable specific actions. Data is cached in
`localStorage` to avoid flicker during reloads.

Wrap your application with `PermissionsProvider`, protect pages with
`<RouteGuard routePath={ROUTES.somePath}>` and wrap buttons with
`<IfCan routePath={ROUTES.somePath} action="edit">` to hide or disable them
when the user lacks permissions.
