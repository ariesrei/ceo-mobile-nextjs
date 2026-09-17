import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  getBuildAppProfile,
  normalizeAppProfile,
  profileMismatchMessage,
} from "@/lib/app-profile";
import {
  applyAuthCookies,
  siteProfileFromUser,
  tokensFromBody,
} from "@/lib/auth-session";
import { COOKIE_BASE_URL } from "@/lib/wp";

/** Browser already talked to WordPress; Next only stores the session cookies. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tokens = tokensFromBody(body);
  const jar = await cookies();
  const baseUrl = String(body.baseUrl || jar.get(COOKIE_BASE_URL)?.value || "").replace(
    /\/+$/,
    ""
  );

  if (!baseUrl || !tokens.access_token || !tokens.refresh_token) {
    return NextResponse.json({ message: "Session tokens are required." }, { status: 400 });
  }

  const siteProfile =
    normalizeAppProfile(tokens.user?.app_profile) ||
    normalizeAppProfile(jar.get(COOKIE_SITE_PROFILE)?.value) ||
    siteProfileFromUser(tokens.user);
  const buildProfile =
    normalizeAppProfile(jar.get(COOKIE_APP_PROFILE)?.value) || getBuildAppProfile();
  if (buildProfile && buildProfile !== siteProfile) {
    return NextResponse.json(
      { message: profileMismatchMessage(buildProfile) },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    user: tokens.user || null,
    expires_in: tokens.expires_in,
    appProfile: siteProfile,
  });
  applyAuthCookies(response, {
    baseUrl,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    user: tokens.user,
    siteProfile,
  });
  return response;
}
