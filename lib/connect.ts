import { normalizeAppProfile, type AppProfile } from "./app-profile";
import type { ConnectConfig } from "./types";

export const CONNECT_STORAGE_KEY = "ceo_app_connect";

let cachedRaw: string | null | undefined;
let cachedConfig: ConnectConfig | null = null;

export function normalizeSecurityKey(input: string): string {
  return input.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, "").trim();
}

export function normalizeBaseUrl(input: string): string {
  let url = input.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
}

/** Property URL from an app reset-password email (`?site=`). Reject junk schemes. */
export function propertySiteFromQuery(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return normalizeBaseUrl(parsed.origin + parsed.pathname);
  } catch {
    return "";
  }
}

export function getConnectConfig(): ConnectConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONNECT_STORAGE_KEY);
    if (raw === cachedRaw) return cachedConfig;
    cachedRaw = raw;
    if (!raw) {
      cachedConfig = null;
      return null;
    }
    const parsed = JSON.parse(raw) as ConnectConfig;
    cachedConfig = parsed?.baseUrl ? parsed : null;
    return cachedConfig;
  } catch {
    cachedRaw = undefined;
    cachedConfig = null;
    return null;
  }
}

export function writeConnectConfig(
  patch: Partial<ConnectConfig> & { baseUrl: string }
): ConnectConfig {
  const nextUrl = normalizeBaseUrl(patch.baseUrl);
  const existing = getConnectConfig();
  const sameProperty =
    Boolean(existing?.baseUrl) &&
    normalizeBaseUrl(existing?.baseUrl || "") === nextUrl;
  const prior = sameProperty ? existing : undefined;
  const config: ConnectConfig = {
    baseUrl: nextUrl,
    verifiedAt: patch.verifiedAt || new Date().toISOString(),
    clientName: pick(patch.clientName, prior?.clientName),
    clientLogo: pick(patch.clientLogo, prior?.clientLogo),
    clientHero: pick(patch.clientHero, prior?.clientHero),
    clientTagline: pick(patch.clientTagline, prior?.clientTagline),
    planKey: patch.planKey || prior?.planKey,
    appProfile: normalizeAppProfile(patch.appProfile) || prior?.appProfile,
  };
  const raw = JSON.stringify(config);
  window.localStorage.setItem(CONNECT_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedConfig = config;
  return config;
}

function pick(next?: string, prev?: string) {
  const value = (next || prev || "").trim();
  return value || undefined;
}

/** @deprecated Prefer writeConnectConfig({ baseUrl, clientName, ... }) */
export function saveConnectConfig(
  baseUrl: string,
  clientName?: string,
  clientLogo?: string,
  clientHero?: string,
  clientTagline?: string,
  extras?: { planKey?: string; appProfile?: AppProfile | string }
): ConnectConfig {
  return writeConnectConfig({
    baseUrl,
    clientName,
    clientLogo,
    clientHero,
    clientTagline,
    planKey: extras?.planKey,
    appProfile: normalizeAppProfile(extras?.appProfile) || undefined,
  });
}

export function getClientName(): string {
  return (getConnectConfig()?.clientName || "").trim() || "Client";
}

export function getClientLogo(): string {
  return (getConnectConfig()?.clientLogo || "").trim();
}

export function getClientHero(): string {
  return (getConnectConfig()?.clientHero || "").trim();
}

export function getClientTagline(): string {
  return (getConnectConfig()?.clientTagline || "").trim();
}

export function clearConnectConfig(): void {
  window.localStorage.removeItem(CONNECT_STORAGE_KEY);
  cachedRaw = null;
  cachedConfig = null;
}
