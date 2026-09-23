import type { NavRole } from "./navigation";

const ACCESS_KEY = "ceo_wp_access";
const REFRESH_KEY = "ceo_wp_refresh";
const NAV_ROLE_KEY = "ceo_nav_role";
const NAV_USER_KEY = "ceo_nav_user";
const NAV_MENUS_KEY = "ceo_nav_menus_v1";
const WARRANTY_HOME_KEY = "ceo_warranty_home_v3";

function readStore(store: Storage): { access: string; refresh: string } {
  return {
    access: store.getItem(ACCESS_KEY) || "",
    refresh: store.getItem(REFRESH_KEY) || "",
  };
}

function writeStore(store: Storage, accessToken: string, refreshToken: string) {
  store.setItem(ACCESS_KEY, accessToken);
  store.setItem(REFRESH_KEY, refreshToken);
}

export function saveBrowserTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  try {
    writeStore(window.localStorage, accessToken, refreshToken);
  } catch {
    /* private mode */
  }
  try {
    writeStore(window.sessionStorage, accessToken, refreshToken);
  } catch {
    /* private mode */
  }
}

export function getBrowserAccessToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      readStore(window.localStorage).access ||
      readStore(window.sessionStorage).access
    );
  } catch {
    return "";
  }
}

export function getBrowserRefreshToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return (
      readStore(window.localStorage).refresh ||
      readStore(window.sessionStorage).refresh
    );
  } catch {
    return "";
  }
}

export function clearBrowserTokens() {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    try {
      store.removeItem(ACCESS_KEY);
      store.removeItem(REFRESH_KEY);
    } catch {
      /* private mode */
    }
  }
  try {
    window.sessionStorage.removeItem(NAV_MENUS_KEY);
    window.sessionStorage.removeItem(NAV_ROLE_KEY);
    window.sessionStorage.removeItem(NAV_USER_KEY);
    window.sessionStorage.removeItem(WARRANTY_HOME_KEY);
  } catch {
    /* private mode */
  }
}

export function readStoredNavRole(): NavRole {
  if (typeof window === "undefined") return "unknown";
  try {
    const value = window.sessionStorage.getItem(NAV_ROLE_KEY);
    if (value === "staff" || value === "resident") return value;
  } catch {
    /* private mode */
  }
  return "unknown";
}

export function writeStoredNavRole(
  role: NavRole,
  userId?: number | string
) {
  if (typeof window === "undefined") return;
  try {
    if (role === "unknown") {
      window.sessionStorage.removeItem(NAV_ROLE_KEY);
    } else {
      window.sessionStorage.setItem(NAV_ROLE_KEY, role);
    }
    if (userId) {
      window.sessionStorage.setItem(NAV_USER_KEY, String(userId));
    }
  } catch {
    /* private mode */
  }
}

export function readStoredNavUser(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(NAV_USER_KEY) || "";
  } catch {
    return "";
  }
}
