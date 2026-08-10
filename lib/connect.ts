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

export function saveConnectConfig(
  baseUrl: string,
  clientName?: string,
  clientLogo?: string
): ConnectConfig {
  const existing = getConnectConfig();
  const config: ConnectConfig = {
    baseUrl: normalizeBaseUrl(baseUrl),
    verifiedAt: new Date().toISOString(),
    clientName: (clientName || existing?.clientName || "").trim() || undefined,
    clientLogo: (clientLogo || existing?.clientLogo || "").trim() || undefined,
  };
  window.localStorage.setItem(CONNECT_STORAGE_KEY, JSON.stringify(config));
  return config;
}

export function clearConnectConfig(): void {
  window.localStorage.removeItem(CONNECT_STORAGE_KEY);
}
