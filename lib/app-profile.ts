export type AppProfile = "warranty" | "operations";

export const COOKIE_APP_PROFILE = "ceo_app_profile";
export const COOKIE_SITE_PROFILE = "ceo_site_app_profile";

export const WARRANTY_MENU_ALLOWLIST = [
  "warranties",
  "profile",
  "edit_profile",
  "additional_info",
  "history",
] as const;

export const WARRANTY_BLOCKED_PATHS = [
  "/account/parcels",
  "/account/maintenance",
  "/account/guests",
  "/account/contacts",
  "/account/activities",
  "/account/reservations",
  "/account/messaging",
  "/account/classifieds",
];

export function normalizeAppProfile(
  value?: string | null
): AppProfile | null {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "warranty" || raw === "operations") return raw;
  return null;
}

export function goPath(profile: AppProfile): `/go/${AppProfile}` {
  return `/go/${profile}`;
}

function propertyUrlHaystack(baseUrl: string): string {
  const raw = (baseUrl || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return `${url.hostname}${url.pathname}${url.search}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  } catch {
    return raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  }
}

function propertyUrlQueryProfile(baseUrl: string): AppProfile | null {
  try {
    const url = new URL(
      /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`
    );
    return (
      normalizeAppProfile(url.searchParams.get("app")) ||
      normalizeAppProfile(url.searchParams.get("app_profile"))
    );
  } catch {
    return null;
  }
}

/**
 * Robert (15 Sep): Hawaii / member buildings = Operations. Warranty =
 * everyone else that is not members (Gorman, AR Homes, Fort Whipple,
 * Pacific Vista 2 & 3). Pacific Vista 1 is Operations.
 */
export function profileFromPropertyUrl(baseUrl: string): AppProfile | null {
  const fromQuery = propertyUrlQueryProfile(baseUrl);
  if (fromQuery) return fromQuery;

  const hay = propertyUrlHaystack(baseUrl);
  if (!hay) return null;

  if (
    /pacificvista[23]|pv[23](?![0-9])|fortwhipple|whippleapart|gorman|arhomes/.test(
      hay
    )
  ) {
    return "warranty";
  }

  if (/waihonua|parklane|capitalplace|allure|pacificvista/.test(hay)) {
    return "operations";
  }

  return null;
}

export function resolveSiteAppProfile(
  wpProfile?: string | null,
  propertyUrl?: string | null
): AppProfile {
  return (
    profileFromPropertyUrl(propertyUrl || "") ||
    normalizeAppProfile(wpProfile) ||
    "warranty"
  );
}

/** Splash/login: URL first so leftover ops cookies cannot paint Fort Whipple green. */
export function resolveDisplayAppProfile(input: {
  wpProfile?: string | null;
  propertyUrl?: string | null;
  siteCookie?: string | null;
  appCookie?: string | null;
}): AppProfile {
  return (
    profileFromPropertyUrl(input.propertyUrl || "") ||
    normalizeAppProfile(input.wpProfile) ||
    normalizeAppProfile(input.siteCookie) ||
    normalizeAppProfile(input.appCookie) ||
    getBuildAppProfile() ||
    "warranty"
  );
}

/** Resident community chrome (home / amenities tabs). Warranty APK stays off. */
export function showOpsCommunityUi(appProfile?: AppProfile | null): boolean {
  if (getBuildAppProfile() === "warranty") return false;
  if (getBuildAppProfile() === "operations") return true;
  return appProfile === "operations";
}

/** Pets/Vehicles My Assets. Ops build and unlocked web; Warranty APK keeps Additional Information. */
export function showOpsAssetsUi(): boolean {
  return getBuildAppProfile() !== "warranty";
}

/** Native / env product identity. Null on unlocked web (no flavor). */
export function getBuildAppProfile(): AppProfile | null {
  return (
    normalizeAppProfile(process.env.NEXT_PUBLIC_APP_PROFILE) ||
    normalizeAppProfile(process.env.NEXT_PUBLIC_CEO_APP_VARIANT)
  );
}

export function productName(profile: AppProfile | null | undefined): string {
  return profile === "operations"
    ? "CE OneSource Operations"
    : "ClaimTrack";
}

export function otherProductName(profile: AppProfile): string {
  return profile === "warranty" ? "CE OneSource Operations" : "ClaimTrack";
}

export function profileMismatchMessage(buildProfile: AppProfile): string {
  if (buildProfile === "warranty") {
    return "This property uses the Operations app. Install CE OneSource Operations instead of ClaimTrack.";
  }
  return "This property uses the Warranty plan. Install ClaimTrack instead of the Operations app.";
}

export function isWarrantyProfile(
  ...candidates: Array<AppProfile | string | null | undefined>
): boolean {
  return candidates.some((c) => normalizeAppProfile(c) === "warranty");
}

export function isWarrantyPathBlocked(
  path: string,
  profile: AppProfile | null | undefined
): boolean {
  if (profile !== "warranty") return false;
  return WARRANTY_BLOCKED_PATHS.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`)
  );
}
