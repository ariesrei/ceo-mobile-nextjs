import { cache } from "react";
import { cookies } from "next/headers";
import { COOKIE_APP_PROFILE, COOKIE_SITE_PROFILE } from "./app-profile";
import { fetchErrorMessage, serverFetch } from "./server-fetch";
import type { ConnectConfig } from "./types";
import { publicWpErrorMessage } from "./wp-error";

export const COOKIE_ACCESS = "ceo_access_token";
export const COOKIE_REFRESH = "ceo_refresh_token";
export const COOKIE_BASE_URL = "ceo_wp_base_url";
export const COOKIE_CLIENT_NAME = "ceo_client_name";
export const COOKIE_CLIENT_LOGO = "ceo_client_logo";
export const COOKIE_CLIENT_HERO = "ceo_client_hero";
export const COOKIE_CLIENT_TAGLINE = "ceo_client_tagline";
export const COOKIE_FIRST_NAME = "ceo_first_name";
export { COOKIE_APP_PROFILE, COOKIE_SITE_PROFILE };

const expireCookieOpts = {
  path: "/",
  maxAge: 0,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

type CookieResponse = {
  cookies: {
    set: (
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        path?: string;
        maxAge?: number;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
      }
    ) => void;
  };
};

/** Drop connect + auth cookies so Change property can start a new site. */
export function clearSessionCookies(response: CookieResponse) {
  const httpOnlyNames = [
    COOKIE_ACCESS,
    COOKIE_REFRESH,
    COOKIE_BASE_URL,
    COOKIE_CLIENT_NAME,
    COOKIE_CLIENT_LOGO,
    COOKIE_CLIENT_HERO,
    COOKIE_CLIENT_TAGLINE,
    COOKIE_FIRST_NAME,
  ];
  const readableNames = [COOKIE_APP_PROFILE, COOKIE_SITE_PROFILE];
  for (const name of httpOnlyNames) {
    response.cookies.set(name, "", { ...expireCookieOpts, httpOnly: true });
  }
  for (const name of readableNames) {
    response.cookies.set(name, "", { ...expireCookieOpts, httpOnly: false });
  }
}

export function apiUrl(baseUrl: string, path: string): string {
  const root = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${root}/wp-json/onesource/v1${p}`;
}

export async function getServerConnect(): Promise<ConnectConfig | null> {
  const jar = await cookies();
  const baseUrl = jar.get(COOKIE_BASE_URL)?.value;
  if (!baseUrl) return null;
  return { baseUrl, verifiedAt: "" };
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_ACCESS)?.value || null;
}

async function wpFetchServerImpl<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const connect = await getServerConnect();
  const token = await getAccessToken();
  if (!connect?.baseUrl) {
    return { error: "Property not connected.", status: 400 };
  }
  if (!token) {
    return { error: "Not authenticated.", status: 401 };
  }

  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // A transport failure (LocalWP down, untrusted cert) must not escape: these
  // callers are server components, so a throw here renders as a bare 500 with
  // no clue what went wrong.
  const url = apiUrl(connect.baseUrl, path);
  let res: Response;
  try {
    res = await serverFetch(url, { ...init, headers, cache: "no-store" });
  } catch (err) {
    return { error: fetchErrorMessage(err, url), status: 502 };
  }

  const rawBody = await res.text();
  const json = (() => {
    try {
      return rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return { message: rawBody };
    }
  })() as { message?: string; error?: string };

  if (!res.ok) {
    const message = publicWpErrorMessage(
      json.message || json.error || rawBody,
      `Request failed (${res.status})`
    );
    return { error: message, status: res.status };
  }

  return { data: json as T, status: res.status };
}

const wpGetCached = cache((path: string) => wpFetchServerImpl(path));

/** GET requests are deduped per RSC request so layouts do not hit /app/me twice. */
export async function wpFetchServer<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const method = String(init.method || "GET").toUpperCase();
  if (method === "GET" && !init.body) {
    return wpGetCached(path) as Promise<{ data?: T; error?: string; status: number }>;
  }
  return wpFetchServerImpl<T>(path, init);
}

/** Browser-side WP fetch using cookies via Next API proxy. */
export async function wpFetchClient<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const res = await fetch(`/api/wp${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const rawBody = await res.text();
  const json = (() => {
    try {
      return rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return { message: rawBody };
    }
  })() as { message?: string; error?: string };

  if (!res.ok) {
    const message = publicWpErrorMessage(
      json.message || json.error || rawBody,
      `Request failed (${res.status})`
    );
    return { error: message, status: res.status };
  }

  return { data: json as T, status: res.status };
}
