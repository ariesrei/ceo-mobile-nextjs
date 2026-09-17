import { normalizeAppProfile, type AppProfile } from "./app-profile";
import type { ConnectConfig } from "./types";

export const CONNECT_STORAGE_KEY = "ceo_app_connect";

export function normalizeBaseUrl(input: string): string {
  let url = input.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

export function getConnectConfig(): ConnectConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONNECT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConnectConfig;
    if (!parsed?.baseUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getClientName(): string {
  const cfg = getConnectConfig();
  const name = (cfg?.clientName || "").trim();
  return name || "Client";
}

export function getClientLogo(): string {
  const cfg = getConnectConfig();
  return (cfg?.clientLogo || "").trim();
}

export function getClientHero(): string {
  const cfg = getConnectConfig();
  return (cfg?.clientHero || "").trim();
}

export function getClientTagline(): string {
  const cfg = getConnectConfig();
  return (cfg?.clientTagline || "").trim();
}

/**
 * Only the property this device connected to is stored. We deliberately keep no
 * list of properties, so a user can never browse or pick another one.
 */
export function saveConnectConfig(
  baseUrl: string,
  clientName?: string,
  clientLogo?: string,
  clientHero?: string,
  clientTagline?: string,
  extras?: { planKey?: string; appProfile?: AppProfile | string }
): ConnectConfig {
  const nextUrl = normalizeBaseUrl(baseUrl);
  const existing = getConnectConfig();
  const sameProperty =
    Boolean(existing?.baseUrl) &&
    normalizeBaseUrl(existing?.baseUrl || "") === nextUrl;
  const prior = sameProperty ? existing : undefined;
  const config: ConnectConfig = {
    baseUrl: nextUrl,
    verifiedAt: new Date().toISOString(),
    clientName: (clientName || prior?.clientName || "").trim() || undefined,
    clientLogo: (clientLogo || prior?.clientLogo || "").trim() || undefined,
    clientHero: (clientHero || prior?.clientHero || "").trim() || undefined,
    clientTagline:
      (clientTagline || prior?.clientTagline || "").trim() || undefined,
    planKey: extras?.planKey || prior?.planKey,
    appProfile: normalizeAppProfile(extras?.appProfile) || prior?.appProfile,
  };
  window.localStorage.setItem(CONNECT_STORAGE_KEY, JSON.stringify(config));
  return config;
}

export function clearConnectConfig(): void {
  window.localStorage.removeItem(CONNECT_STORAGE_KEY);
}
