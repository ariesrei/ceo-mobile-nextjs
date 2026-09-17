import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { AppUser, NavigationResponse } from "./types";
import {
  apiUrl,
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_REFRESH,
  COOKIE_CLIENT_HERO,
  COOKIE_CLIENT_LOGO,
  COOKIE_CLIENT_NAME,
  COOKIE_CLIENT_TAGLINE,
  wpFetchServer,
} from "./wp";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  resolveDisplayAppProfile,
} from "./app-profile";
import { applyNavVisibility, isPathAllowed } from "./navigation";
import { serverFetch } from "./server-fetch";
import { isWafBlockedResult } from "./wp-error";

export async function getServerAppProfile() {
  const jar = await cookies();
  return resolveDisplayAppProfile({
    propertyUrl: jar.get(COOKIE_BASE_URL)?.value,
    siteCookie: jar.get(COOKIE_SITE_PROFILE)?.value,
    appCookie: jar.get(COOKIE_APP_PROFILE)?.value,
  });
}

export type ClientBranding = {
  name: string;
  tagline: string;
  logo: string;
  hero: string;
};

/**
 * Resolve WordPress site/client name + logo for the header.
 * Cookie first, then /app/me (deduped per request).
 */
async function fetchPublicWpBranding(
  baseUrl: string
): Promise<Partial<ClientBranding>> {
  try {
    const res = await serverFetch(apiUrl(baseUrl, "/mobile/branding"), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return {};
    }
    const data = (await res.json().catch(() => ({}))) as {
      client_name?: string;
      client_logo?: string;
      client_hero?: string;
      client_tagline?: string;
    };
    return {
      name: String(data.client_name || "").trim(),
      logo: String(data.client_logo || "").trim(),
      hero: String(data.client_hero || "").trim(),
      tagline: String(data.client_tagline || "").trim(),
    };
  } catch {
    return {};
  }
}

const EMPTY_BRANDING: ClientBranding = {
  name: "",
  tagline: "",
  logo: "",
  hero: "",
};

export const getServerClientBranding = cache(async (): Promise<ClientBranding> => {
  try {
    return await resolveClientBranding();
  } catch {
    return { ...EMPTY_BRANDING };
  }
});

async function resolveClientBranding(): Promise<ClientBranding> {
  const jar = await cookies();
  const fromCookieName = jar.get(COOKIE_CLIENT_NAME)?.value?.trim() || "";
  const fromCookieLogo = jar.get(COOKIE_CLIENT_LOGO)?.value?.trim() || "";
  const baseUrl = jar.get(COOKIE_BASE_URL)?.value?.trim() || "";

  let name = fromCookieName && fromCookieName !== "Client" ? fromCookieName : "";
  let logo = fromCookieLogo;
  // Set at connect time, so the login screen has a background before sign-in.
  let hero = jar.get(COOKIE_CLIENT_HERO)?.value?.trim() || "";
  let tagline = jar.get(COOKIE_CLIENT_TAGLINE)?.value?.trim() || "";

  // Connect used to return name + logo only, so a device can be connected
  // with an empty hero cookie. Ask WordPress for the public photo before we
  // treat logo-alone as "branding is complete" and skip further lookups.
  if (baseUrl && !hero) {
    const pub = await fetchPublicWpBranding(baseUrl);
    if (!name) name = pub.name || "";
    if (!logo) logo = pub.logo || "";
    if (!hero) hero = pub.hero || "";
    if (!tagline) tagline = pub.tagline || "";
  }

  // Connect/login already stored branding. Hitting /app/me here blocked every
  // account and warranty screen for as long as WordPress took to build the
  // user payload (access flags, modules, hero). Skip that when cookies exist.
  if (name && (hero || logo)) {
    return { name, tagline, logo, hero };
  }

  const token = jar.get(COOKIE_ACCESS)?.value;
  if (!token) {
    return { name, tagline, logo, hero };
  }

  const me = await wpFetchServer<AppUser>("/app/me");
  if (!name) {
    name = me.data?.client_name?.trim() || "";
  }
  if (!logo) {
    logo = me.data?.client_logo?.trim() || "";
  }
  if (!hero) {
    hero = me.data?.client_hero?.trim() || "";
  }
  if (!tagline) {
    tagline = me.data?.client_tagline?.trim() || "";
  }
  return { name, tagline, logo, hero };
}

export async function getServerClientName(): Promise<string> {
  const branding = await getServerClientBranding();
  return branding?.name ?? "";
}

export async function requireConnected() {
  const jar = await cookies();
  if (!jar.get(COOKIE_BASE_URL)?.value) {
    redirect("/connect");
  }
}

export async function requireAuth() {
  await requireConnected();
  const jar = await cookies();
  if (!jar.get(COOKIE_ACCESS)?.value && !jar.get(COOKIE_REFRESH)?.value) {
    redirect("/login");
  }
}

function blockedNav(): NavigationResponse {
  return { role_primary: "", roles: [], menus: [], upstream_blocked: true };
}

export async function getNavigation(): Promise<NavigationResponse | null> {
  const [result, profile] = await Promise.all([
    wpFetchServer<NavigationResponse>("/app/navigation"),
    getServerAppProfile(),
  ]);
  if (isWafBlockedResult(result)) {
    return blockedNav();
  }
  return applyNavVisibility(result.data || null, profile);
}

export async function requireMenuPath(path: string) {
  await requireAuth();
  const [result, profile] = await Promise.all([
    wpFetchServer<NavigationResponse>("/app/navigation"),
    getServerAppProfile(),
  ]);
  if (isWafBlockedResult(result)) {
    return blockedNav();
  }
  const nav = applyNavVisibility(result.data || null, profile);
  if (!isPathAllowed(nav, path, profile)) {
    redirect("/account");
  }
  return nav;
}

export function isStaffMenuPath(
  nav: NavigationResponse | null | undefined,
  path: string
): boolean {
  if (nav?.upstream_blocked) return true;
  return Boolean(
    nav?.menus?.some(
      (m) => m.enabled && m.path === path && m.group === "staff"
    )
  );
}
