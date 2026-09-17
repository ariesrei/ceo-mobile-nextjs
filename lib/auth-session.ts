import { NextResponse } from "next/server";
import {
  COOKIE_SITE_PROFILE,
  normalizeAppProfile,
  type AppProfile,
} from "./app-profile";
import type { AppUser } from "./types";
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

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function applyAuthCookies(
  response: NextResponse,
  input: {
    baseUrl: string;
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: Partial<AppUser> | null;
    siteProfile: AppProfile;
  }
) {
  const maxAccess = input.expires_in || 3600;
  response.cookies.set(COOKIE_BASE_URL, input.baseUrl.replace(/\/+$/, ""), {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set(COOKIE_ACCESS, input.access_token, {
    ...cookieOpts,
    maxAge: maxAccess,
  });
  response.cookies.set(COOKIE_REFRESH, input.refresh_token, {
    ...cookieOpts,
    maxAge: 60 * 60 * 24 * 30,
  });

  const user = input.user || {};
  const clientName = String(user.client_name || "").trim();
  const clientLogo = String(user.client_logo || "").trim();
  const clientHero = String(user.client_hero || "").trim();
  const clientTagline = String(user.client_tagline || "").trim();
  const firstName =
    String(user.first_name || "").trim() ||
    String(user.display_name || "")
      .trim()
      .split(/\s+/)[0] ||
    "";

  if (clientName) {
    response.cookies.set(COOKIE_CLIENT_NAME, clientName, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (clientLogo) {
    response.cookies.set(COOKIE_CLIENT_LOGO, clientLogo, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (clientHero) {
    response.cookies.set(COOKIE_CLIENT_HERO, clientHero, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (clientTagline) {
    response.cookies.set(COOKIE_CLIENT_TAGLINE, clientTagline, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (firstName) {
    response.cookies.set(COOKIE_FIRST_NAME, firstName, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  response.cookies.set(COOKIE_SITE_PROFILE, input.siteProfile, {
    ...cookieOpts,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export function tokensFromBody(body: Record<string, unknown>): {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: AppUser;
} {
  return {
    access_token: String(body.access_token || ""),
    refresh_token: String(body.refresh_token || ""),
    expires_in: Number(body.expires_in) || 3600,
    user: (body.user as AppUser | undefined) || undefined,
  };
}

export function siteProfileFromUser(user?: Partial<AppUser> | null): AppProfile {
  return normalizeAppProfile(user?.app_profile) || "operations";
}
