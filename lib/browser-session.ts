const ACCESS_KEY = "ceo_wp_access";
const REFRESH_KEY = "ceo_wp_refresh";

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
    window.sessionStorage.removeItem("ceo_nav_menus_v1");
  } catch {
    /* private mode */
  }
}
