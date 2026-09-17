import {
  isWarrantyProfile,
  normalizeAppProfile,
  WARRANTY_MENU_ALLOWLIST,
  type AppProfile,
} from "./app-profile";
import type { MenuItem, NavigationResponse } from "./types";

/** Temporary: hide these modules for staff and residents. */
export const HIDDEN_MENU_IDS: string[] = ["messaging"];

function isHiddenMenu(item: MenuItem): boolean {
  return (
    HIDDEN_MENU_IDS.includes(item.id) ||
    (item.path === "/account/messaging" && HIDDEN_MENU_IDS.includes("messaging"))
  );
}

function resolveProfile(
  nav?: NavigationResponse | null,
  profile?: AppProfile | null
): AppProfile | null {
  return (
    normalizeAppProfile(profile) ||
    normalizeAppProfile(nav?.app_profile) ||
    null
  );
}

function isWarrantyAllowed(item: MenuItem): boolean {
  return (WARRANTY_MENU_ALLOWLIST as readonly string[]).includes(item.id);
}

/** Apply product + temporary module visibility. */
export function applyMenuVisibility(
  menus: MenuItem[],
  profile?: AppProfile | null
): MenuItem[] {
  const warranty = isWarrantyProfile(profile);
  return menus.map((m) => {
    if (isHiddenMenu(m)) {
      return { ...m, enabled: false };
    }
    if (warranty && !isWarrantyAllowed(m)) {
      return { ...m, enabled: false };
    }
    return m;
  });
}

export function applyNavVisibility(
  nav: NavigationResponse | null | undefined,
  profile?: AppProfile | null
): NavigationResponse | null {
  if (!nav) return null;
  const resolved = resolveProfile(nav, profile);
  return {
    ...nav,
    menus: applyMenuVisibility(nav.menus || [], resolved),
  };
}

export function enabledMenus(
  nav: NavigationResponse | null | undefined,
  profile?: AppProfile | null
): MenuItem[] {
  const filtered = applyNavVisibility(nav, profile);
  if (!filtered?.menus?.length) return [];
  return filtered.menus.filter((m) => m.enabled);
}

export function isPathAllowed(
  nav: NavigationResponse | null | undefined,
  path: string,
  profile?: AppProfile | null
): boolean {
  if (nav?.upstream_blocked) return true;
  const filtered = applyNavVisibility(nav, profile);
  if (!filtered?.menus?.length) return false;
  return filtered.menus.some((m) => m.enabled && m.path === path);
}
