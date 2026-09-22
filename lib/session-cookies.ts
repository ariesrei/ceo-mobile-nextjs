import { NextResponse } from "next/server";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  type AppProfile,
} from "./app-profile";
import type { AuthTokens } from "./types";
import {
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_CLIENT_HERO,
  COOKIE_CLIENT_LOGO,
  COOKIE_CLIENT_NAME,
  COOKIE_CLIENT_TAGLINE,
  COOKIE_FIRST_NAME,
  COOKIE_REFRESH,
} from "./wp";

export const YEAR_SECONDS = 60 * 60 * 24 * 365;
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function cookieOpts(httpOnly = true, maxAge = YEAR_SECONDS) {
  return {
    httpOnly,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export type PropertyCookieInput = {
  baseUrl: string;
  siteProfile: AppProfile;
  clientName?: string;
  clientLogo?: string;
  clientHero?: string;
  clientTagline?: string;
  firstName?: string;
};

function setIf(response: NextResponse, name: string, value?: string) {
  const text = (value || "").trim();
  if (!text) return;
  response.cookies.set(name, text, cookieOpts());
}

/** Connect + login: property URL, product lock, and WP branding cookies. */
export function applyPropertyCookies(
  response: NextResponse,
  input: PropertyCookieInput
) {
  response.cookies.set(COOKIE_BASE_URL, input.baseUrl, cookieOpts());
  response.cookies.set(COOKIE_APP_PROFILE, input.siteProfile, cookieOpts(false));
  response.cookies.set(COOKIE_SITE_PROFILE, input.siteProfile, cookieOpts(false));
  setIf(response, COOKIE_CLIENT_NAME, input.clientName);
  setIf(response, COOKIE_CLIENT_LOGO, input.clientLogo);
  setIf(response, COOKIE_CLIENT_HERO, input.clientHero);
  setIf(response, COOKIE_CLIENT_TAGLINE, input.clientTagline);
  setIf(response, COOKIE_FIRST_NAME, input.firstName);
}

export function applyAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set(COOKIE_ACCESS, tokens.access_token, {
    ...cookieOpts(),
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });
  response.cookies.set(COOKIE_REFRESH, tokens.refresh_token, {
    ...cookieOpts(),
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

export function firstNameFromUser(user?: {
  first_name?: string;
  display_name?: string;
}): string {
  const first = String(user?.first_name || "").trim();
  if (first) return first;
  return (
    String(user?.display_name || "")
      .trim()
      .split(/\s+/)[0] || ""
  );
}
