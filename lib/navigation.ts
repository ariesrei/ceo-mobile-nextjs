import type { MenuItem, NavigationResponse } from "./types";

/**
 * Temporary: which *staff* modules to show. Resident (account) menus are never filtered.
 * Set to null to restore all staff modules (Contacts, Guests, etc.).
 */
export const STAFF_MENU_ALLOWLIST: string[] | null = [
  "parcels",
  "maintenance",
  "guests",
  "warranties",
];

function isStaffMenu(item: MenuItem): boolean {
  return item.group === "staff";
}

function isAllowedStaffMenu(item: MenuItem): boolean {
  if (!STAFF_MENU_ALLOWLIST) return true;
  return (
    STAFF_MENU_ALLOWLIST.includes(item.id) ||
    (item.path === "/account/parcels" &&
      STAFF_MENU_ALLOWLIST.includes("parcels")) ||
    (item.path === "/account/maintenance" &&
      STAFF_MENU_ALLOWLIST.includes("maintenance")) ||
    (item.path === "/account/guests" &&
      STAFF_MENU_ALLOWLIST.includes("guests")) ||
    (item.path === "/account/warranties" &&
      STAFF_MENU_ALLOWLIST.includes("warranties"))
  );
}

/** Apply temporary staff-module visibility (resident menus stay as returned by WP). */
export function applyMenuVisibility(menus: MenuItem[]): MenuItem[] {
  if (!STAFF_MENU_ALLOWLIST) {
    return menus;
  }
  return menus.map((m) => {
    if (!isStaffMenu(m)) {
      return m;
    }
    return {
      ...m,
      enabled: Boolean(m.enabled && isAllowedStaffMenu(m)),
    };
  });
}

export function applyNavVisibility(
  nav: NavigationResponse | null | undefined
): NavigationResponse | null {
  if (!nav) return null;
  return {
    ...nav,
    menus: applyMenuVisibility(nav.menus || []),
  };
}

export function enabledMenus(nav: NavigationResponse | null | undefined): MenuItem[] {
  const filtered = applyNavVisibility(nav);
  if (!filtered?.menus?.length) return [];
  return filtered.menus.filter((m) => m.enabled);
}

export function isPathAllowed(
  nav: NavigationResponse | null | undefined,
  path: string
): boolean {
  const filtered = applyNavVisibility(nav);
  if (!filtered?.menus?.length) return false;
  return filtered.menus.some((m) => m.enabled && m.path === path);
}
