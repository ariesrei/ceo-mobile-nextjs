import {
  getBuildAppProfile,
  profileMismatchMessage,
  resolveSiteAppProfile,
  type AppProfile,
} from "./app-profile";

export type WpConnectPayload = {
  valid?: boolean;
  message?: string;
  client_name?: string;
  client_logo?: string;
  client_hero?: string;
  client_tagline?: string;
  plan_key?: string;
  app_profile?: string;
};

export type ConnectResult = {
  valid: true;
  baseUrl: string;
  clientName: string;
  clientLogo: string;
  clientHero: string;
  clientTagline: string;
  planKey: string;
  appProfile: AppProfile;
};

export function connectResultFromWp(
  data: WpConnectPayload,
  baseUrl: string
): ConnectResult {
  return {
    valid: true,
    baseUrl,
    clientName: String(data.client_name || "").trim(),
    clientLogo: String(data.client_logo || "").trim(),
    clientHero: String(data.client_hero || "").trim(),
    clientTagline: String(data.client_tagline || "").trim(),
    planKey: String(data.plan_key || "").trim(),
    appProfile: resolveSiteAppProfile(data.app_profile, baseUrl),
  };
}

/** Env-locked native/web build only. Unlocked Chrome is not refused. */
export function profileLockMessage(siteProfile: AppProfile): string | null {
  const locked = getBuildAppProfile();
  if (locked && locked !== siteProfile) {
    return profileMismatchMessage(locked);
  }
  return null;
}
