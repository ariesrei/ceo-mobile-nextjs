import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { AppUser, NavigationResponse } from "./types";
import {
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_CLIENT_LOGO,
  COOKIE_CLIENT_NAME,
  wpFetchServer,
} from "./wp";
import { applyNavVisibility, isPathAllowed } from "./navigation";

export type ClientBranding = {
  name: string;
  logo: string;
  hero: string;
};

/**
 * Resolve WordPress site/client name + logo for the header.
 * Cookie first, then /app/me (deduped per request).
 */
export const getServerClientBranding = cache(async (): Promise<ClientBranding> => {
  const jar = await cookies();
  const fromCookieName = jar.get(COOKIE_CLIENT_NAME)?.value?.trim() || "";
  const fromCookieLogo = jar.get(COOKIE_CLIENT_LOGO)?.value?.trim() || "";

  let name = fromCookieName && fromCookieName !== "Client" ? fromCookieName : "";
  let logo = fromCookieLogo;
  let hero = "";

  const token = jar.get(COOKIE_ACCESS)?.value;
  if (!token) {
    return { name, logo, hero };
  }

  const me = await wpFetchServer<AppUser>("/app/me");
  if (!name) {
    name = me.data?.client_name?.trim() || "";
  }
  if (!logo) {
    logo = me.data?.client_logo?.trim() || "";
  }
  hero = me.data?.client_hero?.trim() || "";
  return { name, logo, hero };
});

export async function getServerClientName(): Promise<string> {
  const branding = await getServerClientBranding();
  return branding.name;
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
  if (!jar.get(COOKIE_ACCESS)?.value) {
    redirect("/login");
  }
}

export async function getNavigation(): Promise<NavigationResponse | null> {
  const result = await wpFetchServer<NavigationResponse>("/app/navigation");
  return applyNavVisibility(result.data || null);
}

export async function requireMenuPath(path: string) {
  await requireAuth();
  const nav = await getNavigation();
  if (!isPathAllowed(nav, path)) {
    redirect("/account");
  }
  return nav;
}

export function isStaffMenuPath(
  nav: NavigationResponse | null | undefined,
  path: string
): boolean {
  return Boolean(
    nav?.menus?.some(
      (m) => m.enabled && m.path === path && m.group === "staff"
    )
  );
}
