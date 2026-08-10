import { cookies } from "next/headers";
import { serverFetch } from "./server-fetch";
import type { ConnectConfig } from "./types";

export const COOKIE_ACCESS = "ceo_access_token";
export const COOKIE_REFRESH = "ceo_refresh_token";
export const COOKIE_BASE_URL = "ceo_wp_base_url";
export const COOKIE_CLIENT_NAME = "ceo_client_name";
export const COOKIE_CLIENT_LOGO = "ceo_client_logo";

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

export async function wpFetchServer<T>(
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

  const res = await serverFetch(apiUrl(connect.baseUrl, path), {
    ...init,
    headers,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ||
      (json as { error?: string }).error ||
      `Request failed (${res.status})`;
    return { error: message, status: res.status };
  }

  return { data: json as T, status: res.status };
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

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (json as { message?: string }).message ||
      (json as { error?: string }).error ||
      `Request failed (${res.status})`;
    return { error: message, status: res.status };
  }

  return { data: json as T, status: res.status };
}
