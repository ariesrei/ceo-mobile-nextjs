import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SITE_PROFILE, normalizeAppProfile } from "@/lib/app-profile";
import { applyAuthCookies, siteProfileFromUser, tokensFromBody } from "@/lib/auth-session";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import {
  apiUrl,
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_REFRESH,
} from "@/lib/wp";
import type { AuthTokens } from "@/lib/types";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function POST(request: Request) {
  const jar = await cookies();
  const baseUrl = jar.get(COOKIE_BASE_URL)?.value;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const browserTokens = tokensFromBody(body);

  if (body.browserVerified === true && browserTokens.access_token && browserTokens.refresh_token) {
    if (!baseUrl) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }
    const response = NextResponse.json({ success: true, user: browserTokens.user || null });
    applyAuthCookies(response, {
      baseUrl,
      access_token: browserTokens.access_token,
      refresh_token: browserTokens.refresh_token,
      expires_in: browserTokens.expires_in,
      user: browserTokens.user,
      siteProfile:
        normalizeAppProfile(browserTokens.user?.app_profile) ||
        normalizeAppProfile(jar.get(COOKIE_SITE_PROFILE)?.value) ||
        siteProfileFromUser(browserTokens.user),
    });
    return response;
  }

  const refresh = jar.get(COOKIE_REFRESH)?.value;

  if (!baseUrl || !refresh) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  try {
    const res = await serverFetch(apiUrl(baseUrl, "/app/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as AuthTokens & {
      message?: string;
    };

    if (!res.ok) {
      return NextResponse.json(
        { message: data.message || "Refresh failed." },
        { status: res.status }
      );
    }

    const response = NextResponse.json({ user: data.user });
    response.cookies.set(COOKIE_ACCESS, data.access_token, {
      ...cookieOpts,
      maxAge: data.expires_in || 3600,
    });
    response.cookies.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}
