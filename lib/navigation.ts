import {
  getBuildAppProfile,
  WARRANTY_MENU_ALLOWLIST,
  type AppProfile,
} from "./app-profile";
import type { MenuItem, NavigationResponse } from "./types";

/** Temporary: hide these modules for staff and residents. */
export const HIDDEN_MENU_IDS: string[] = [];

/** Ops modules that `/account/warranties/[id]` must not treat as a claim id. */
export const ACCOUNT_MODULE_PATHS: Record<string, string> = {
  parcels: "/account/parcels",
  guests: "/account/guests",
  maintenance: "/account/maintenance",
  messaging: "/account/messaging",
  contacts: "/account/contacts",
  activities: "/account/activities",
  events: "/account/events",
  announcements: "/account/announcements",
  classifieds: "/account/classifieds",
  reservations: "/account/reservations",
  amenities: "/account/reservations",
  entry_pass: "/account/entry-pass",
  unit_entries: "/account/entry-pass",
  profile: "/account/profile",
  additional_info: "/account/additional-info",
  assets: "/account/assets",
  documents: "/account/documents",
  preferences: "/account/preferences",
  actions: "/account/actions",
  pay: "/account/pay",
  pay_balance: "/account/pay",
  edit_profile: "/account/edit",
  history: "/account/history",
  warranties: "/account/warranties",
};

export function menuHref(item: { id: string; path?: string }): string {
  const raw = (item.path || "").trim();
  if (raw.startsWith("/account/")) return raw;
  if (ACCOUNT_MODULE_PATHS[item.id]) return ACCOUNT_MODULE_PATHS[item.id];
  if (raw.startsWith("/")) return raw;
  if (raw) return `/account/${raw.replace(/^account\//, "")}`;
  return "/account";
}

function isHiddenMenu(item: MenuItem): boolean {
  return (
    HIDDEN_MENU_IDS.includes(item.id) ||
    (item.path === "/account/messaging" && HIDDEN_MENU_IDS.includes("messaging"))
  );
}

function isWarrantyAllowed(item: MenuItem): boolean {
  return (WARRANTY_MENU_ALLOWLIST as readonly string[]).includes(item.id);
}

/** Apply product + temporary module visibility. */
export function applyMenuVisibility(menus: MenuItem[]): MenuItem[] {
  // Cookie/site can be "warranty" (Fort Whipple, middleware default) while
  // unlocked :3000 still shows Operations. Only the warranty APK hides ops.
  const warrantyLocked = getBuildAppProfile() === "warranty";
  return menus.map((m) => {
    if (isHiddenMenu(m)) {
      return { ...m, enabled: false };
    }
    if (warrantyLocked && !isWarrantyAllowed(m)) {
      return { ...m, enabled: false };
    }
    return m;
  });
}

export function applyNavVisibility(
  nav: NavigationResponse | null | undefined,
  profile?: AppProfile | null
): NavigationResponse | null {
  void profile;
  if (!nav) return null;
  return {
    ...nav,
    menus: applyMenuVisibility(nav.menus || []),
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

const STAFF_ROLES = new Set([
  "staff_user",
  "building_admin",
  "client_admin",
  "administrator",
]);

export function navHasStaffRole(
  nav?: Pick<NavigationResponse, "roles" | "role_primary"> | null
): boolean {
  if (!nav) return false;
  if (nav.role_primary && STAFF_ROLES.has(nav.role_primary)) return true;
  return (nav.roles || []).some((role) => STAFF_ROLES.has(role));
}

/** Staff chrome only when WP marked that path `group: staff`. Unknown ≠ staff. */
export function menuHasStaffPath(
  menus: MenuItem[] | undefined,
  path: string
): boolean {
  return Boolean(
    menus?.some((m) => m.enabled && m.path === path && m.group === "staff")
  );
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
