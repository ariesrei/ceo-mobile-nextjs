import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  normalizeAppProfile,
  profileFromPropertyUrl,
} from "@/lib/app-profile";

export function middleware(request: NextRequest) {
  const fromQuery = normalizeAppProfile(
    request.nextUrl.searchParams.get("app_profile")
  );
  const fromPath = normalizeGoProfile(request.nextUrl.pathname);
  const incoming = fromQuery || fromPath;
  const fromUrl = profileFromPropertyUrl(
    request.cookies.get("ceo_wp_base_url")?.value || ""
  );
  const existing = normalizeAppProfile(
    request.cookies.get(COOKIE_APP_PROFILE)?.value
  );
  const fromEnv = normalizeAppProfile(process.env.NEXT_PUBLIC_APP_PROFILE);
  const profile = incoming || fromUrl || existing || fromEnv || "warranty";

  const response = NextResponse.next();
  if (profile) {
    const cookie = {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax" as const,
      httpOnly: false,
    };
    response.cookies.set(COOKIE_APP_PROFILE, profile, cookie);
    if (fromUrl || !existing) {
      response.cookies.set(COOKIE_SITE_PROFILE, profile, cookie);
    }
  }
  return response;
}

function normalizeGoProfile(pathname: string) {
  const match = pathname.match(/^\/go\/(warranty|operations)\/?$/i);
  return match ? normalizeAppProfile(match[1]) : null;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
