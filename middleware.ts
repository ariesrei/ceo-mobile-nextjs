import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_APP_PROFILE, normalizeAppProfile } from "@/lib/app-profile";

export function middleware(request: NextRequest) {
  const fromQuery = normalizeAppProfile(
    request.nextUrl.searchParams.get("app_profile")
  );
  const fromPath = normalizeGoProfile(request.nextUrl.pathname);
  const incoming = fromQuery || fromPath;
  const existing = normalizeAppProfile(
    request.cookies.get(COOKIE_APP_PROFILE)?.value
  );
  const fromEnv = normalizeAppProfile(process.env.NEXT_PUBLIC_APP_PROFILE);
  const profile = incoming || existing || fromEnv;

  const response = NextResponse.next();
  if (profile) {
    response.cookies.set(COOKIE_APP_PROFILE, profile, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
    });
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
