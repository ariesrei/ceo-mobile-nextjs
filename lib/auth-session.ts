import { NextResponse } from "next/server";
import {
  COOKIE_SITE_PROFILE,
  resolveSiteAppProfile,
  type AppProfile,
} from "./app-profile";
import { serverFetch } from "./server-fetch";
import type { AppUser, AuthTokens } from "./types";
import {
  apiUrl,
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

type SessionCookieInput = {
  baseUrl: string;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: Partial<AppUser> | null;
  siteProfile: AppProfile;
};

function isSessionCookieInput(
  input: SessionCookieInput | AuthTokens
): input is SessionCookieInput {
  return "baseUrl" in input && "siteProfile" in input;
}

export function applyAuthCookies(
  response: NextResponse,
  input: SessionCookieInput
): NextResponse;
export function applyAuthCookies(
  response: NextResponse,
  input: AuthTokens
): NextResponse;
export function applyAuthCookies(
  response: NextResponse,
  input: SessionCookieInput | AuthTokens
) {
  if (!isSessionCookieInput(input)) {
    response.cookies.set(COOKIE_ACCESS, input.access_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(COOKIE_REFRESH, input.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

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

export function siteProfileFromUser(
  user?: Partial<AppUser> | null,
  propertyUrl?: string | null
): AppProfile {
  return resolveSiteAppProfile(user?.app_profile, propertyUrl);
}

export async function refreshWpTokens(
  baseUrl: string,
  refreshToken: string
): Promise<AuthTokens | null> {
  const res = await serverFetch(apiUrl(baseUrl, "/app/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as AuthTokens & {
    message?: string;
  };
  if (!res.ok || !data.access_token || !data.refresh_token) {
    return null;
  }
  return data;
}
