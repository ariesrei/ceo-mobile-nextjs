import { getConnectConfig } from "./connect";
import {
  clearBrowserTokens,
  getBrowserAccessToken,
  getBrowserRefreshToken,
  saveBrowserTokens,
} from "./browser-session";
import { publicWpErrorMessage } from "./wp-error";
import type { AuthTokens } from "./types";

export function wpRestUrl(baseUrl: string, path: string): string {
  const root = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root}/wp-json/onesource/v1${p}`;
}

export function loginUrl(baseUrl: string): string {
  return wpRestUrl(baseUrl, "/app/auth/login");
}

export function parseAuthBody(rawBody: string): AuthTokens & {
  message?: string;
  code?: string;
} {
  try {
    return JSON.parse(rawBody) as AuthTokens & { message?: string; code?: string };
  } catch {
    return { message: rawBody } as AuthTokens & { message?: string };
  }
}

export async function loginFromProperty(
  baseUrl: string,
  username: string,
  password: string
): Promise<
  | { ok: true; data: AuthTokens }
  | { ok: false; error: string; status: number; network: boolean }
> {
  try {
    const res = await fetch(loginUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const rawBody = await res.text();
    const data = parseAuthBody(rawBody);
    if (!res.ok || !data.access_token || !data.refresh_token) {
      return {
        ok: false,
        error: publicWpErrorMessage(data.message || rawBody, "Login failed."),
        status: res.status,
        network: false,
      };
    }
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: "",
      status: 0,
      network: true,
    };
  }
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function apiWpTarget(input: RequestInfo | URL): { path: string; search: string } | null {
  const url = requestUrl(input);
  const match = url.match(/^(?:https?:\/\/[^/]+)?\/api\/wp(\/[^?]*)?(\?.*)?(?:#.*)?$/);
  if (!match) return null;
  return { path: match[1] || "", search: match[2] || "" };
}

let nativeFetch: typeof fetch | null = null;

async function refreshBrowserSession(baseUrl: string): Promise<string> {
  const refresh = getBrowserRefreshToken();
  if (!refresh || !nativeFetch) return "";
  const res = await nativeFetch(wpRestUrl(baseUrl, "/app/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return "";
  const data = (await res.json().catch(() => ({}))) as AuthTokens;
  if (!data.access_token) return "";
  saveBrowserTokens(data.access_token, data.refresh_token || refresh);
  nativeFetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refresh,
      expires_in: data.expires_in,
      user: data.user,
    }),
  }).catch(() => undefined);
  return data.access_token;
}

async function fetchWordPress(
  baseUrl: string,
  wpPath: string,
  token: string,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(
    init?.headers || (input instanceof Request ? input.headers : undefined)
  );
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const method = (
    init?.method ||
    (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  let body = init?.body;
  if (body === undefined && input instanceof Request && method !== "GET" && method !== "HEAD") {
    body = await input.clone().blob();
  }

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (isForm) {
    headers.delete("Content-Type");
  } else if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return nativeFetch!(wpRestUrl(baseUrl, wpPath), {
    ...init,
    method,
    headers,
    body,
    cache: "no-store",
  });
}

/** Send /api/wp/* from the phone/browser to WordPress so Vercel IPs are not WAF-blocked. */
export function installWpDirectFetch() {
  if (typeof window === "undefined" || nativeFetch) return;
  nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const target = apiWpTarget(input);
    if (!target) {
      return nativeFetch!(input, init);
    }

    const baseUrl = getConnectConfig()?.baseUrl;
    const access = getBrowserAccessToken();
    if (!baseUrl || !access) {
      return nativeFetch!(input, init);
    }

    const wpPath = `/app${target.path}${target.search}`;
    const res = await fetchWordPress(baseUrl, wpPath, access, input, init);
    if (res.status !== 401) return res;

    const nextAccess = await refreshBrowserSession(baseUrl);
    if (!nextAccess) return res;
    return fetchWordPress(baseUrl, wpPath, nextAccess, input, init);
  };
}

export { clearBrowserTokens, saveBrowserTokens };
