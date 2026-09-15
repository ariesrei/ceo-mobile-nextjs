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
];

export function normalizeAppProfile(
  value?: string | null
): AppProfile | null {
  const raw = (value || "").trim().toLowerCase();
  if (raw === "warranty" || raw === "operations") return raw;
  return null;
}

/** Native / env product identity. Null on unlocked web (no flavor). */
export function getBuildAppProfile(): AppProfile | null {
  return (
    normalizeAppProfile(process.env.NEXT_PUBLIC_APP_PROFILE) ||
    normalizeAppProfile(process.env.NEXT_PUBLIC_CEO_APP_VARIANT)
  );
}

export function productName(profile: AppProfile | null | undefined): string {
  return profile === "warranty" ? "ClaimTrack" : "CE OneSource Operations";
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
