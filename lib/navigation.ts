import type { MenuItem, NavigationResponse } from "./types";

export function enabledMenus(nav: NavigationResponse | null | undefined): MenuItem[] {
  if (!nav?.menus?.length) return [];
  return nav.menus.filter((m) => m.enabled);
}

export function isPathAllowed(
  nav: NavigationResponse | null | undefined,
  path: string
): boolean {
  if (!nav?.menus?.length) return false;
  return nav.menus.some((m) => m.enabled && m.path === path);
}
