/**
 * One code base, two app builds.
 *
 * Set NEXT_PUBLIC_CEO_APP_VARIANT=warranty or operations per build.
 * Only the splash screen and login branding differ; everything after
 * sign-in stays driven by the property login.
 */

export type AppVariant = "warranty" | "operations";

/**
 * Company-level assets, shared by both builds. The blue mark is the CE OneSource
 * site logo used on the landing/splash lockup; the brown and green marks are the
 * per-build app icons.
 */
export const COMPANY_MARK = "/brand/company-mark.png";
export const COMPANY_TAGLINE = "BUILDINGS THAT REMEMBER";
export const LANDING_BG = "/brand/landing-bg.jpg";

/**
 * Splash colours for the company-level screen, shown before the device has
 * connected to a property. Navy rather than either variant colour, because at
 * that point the app does not yet know which property it belongs to.
 */
export const COMPANY_SPLASH = {
  from: "#102A4A",
  to: "#040A14",
  glow: "rgba(38, 96, 168, 0.5)",
};

export type AppBrand = {
  variant: AppVariant;
  /** App Store / Play Store display name. */
  appName: string;
  /** Wordmark second line on splash. */
  wordmark: string;
  /** Tagline under the wordmark. */
  tagline: string;
  /** Badge shown above the property hero on login. */
  loginBadge: string;
  logo: string;
  /** Splash + login background wash. */
  splashFrom: string;
  splashTo: string;
  glow: string;
};

const WARRANTY: AppBrand = {
  variant: "warranty",
  appName: "CE OneSource Warranty",
  wordmark: "WARRANTY",
  tagline: "CAPTURE. TRACK. ASSIGN. CLOSE.",
  loginBadge: "Warranty Management",
  logo: "/brand/warranty-logo.png",
  splashFrom: "#2A1A12",
  splashTo: "#0B0705",
  glow: "rgba(140, 86, 54, 0.55)",
};

const OPERATIONS: AppBrand = {
  variant: "operations",
  appName: "CE OneSource Operations",
  wordmark: "OPERATIONS",
  tagline: "OPERATE. SERVE. ENHANCE.",
  loginBadge: "Operations Management",
  logo: "/brand/operations-logo.png",
  splashFrom: "#0C2A1A",
  splashTo: "#04100A",
  glow: "rgba(30, 122, 71, 0.55)",
};

/**
 * Operations ships first; Warranty is the second app build. Set
 * NEXT_PUBLIC_CEO_APP_VARIANT=warranty on that build.
 */
export function appVariant(): AppVariant {
  return process.env.NEXT_PUBLIC_CEO_APP_VARIANT === "warranty"
    ? "warranty"
    : "operations";
}

export function appBrand(): AppBrand {
  return appVariant() === "operations" ? OPERATIONS : WARRANTY;
}
