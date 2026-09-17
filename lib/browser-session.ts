const ACCESS_KEY = "ceo_wp_access";
const REFRESH_KEY = "ceo_wp_refresh";

export function saveBrowserTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ACCESS_KEY, accessToken);
    window.sessionStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    /* private mode */
  }
}

export function getBrowserAccessToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(ACCESS_KEY) || "";
  } catch {
    return "";
  }
}

export function getBrowserRefreshToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(REFRESH_KEY) || "";
  } catch {
    return "";
  }
}

export function clearBrowserTokens() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
    window.sessionStorage.removeItem("ceo_nav_menus_v1");
  } catch {
    /* private mode */
  }
}
