import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  COOKIE_APP_PROFILE,
  COOKIE_SITE_PROFILE,
  getBuildAppProfile,
  normalizeAppProfile,
  profileMismatchMessage,
  type AppProfile,
} from "@/lib/app-profile";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import {
  clearSessionCookies,
  COOKIE_BASE_URL,
  COOKIE_CLIENT_HERO,
  COOKIE_CLIENT_LOGO,
  COOKIE_CLIENT_NAME,
  COOKIE_CLIENT_TAGLINE,
} from "@/lib/wp";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function resolveBuildProfile(): Promise<AppProfile | null> {
  const jar = await cookies();
  return (
    normalizeAppProfile(jar.get(COOKIE_APP_PROFILE)?.value) ||
    getBuildAppProfile()
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const baseUrl = String(body.baseUrl || "").replace(/\/+$/, "");
  const securityKey = String(body.securityKey || "");

  if (!baseUrl || !securityKey) {
    return NextResponse.json(
      { message: "URL and security key are required." },
      { status: 400 }
    );
  }

  try {
    const res = await serverFetch(
      `${baseUrl}/wp-json/onesource/v1/mobile/verify-connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ security_key: securityKey }),
        cache: "no-store",
      }
    );

    const data = (await res.json().catch(() => ({}))) as {
      valid?: boolean;
      message?: string;
      client_name?: string;
      client_logo?: string;
      client_hero?: string;
      client_tagline?: string;
      plan_key?: string;
      app_profile?: string;
    };

    if (!res.ok || !data.valid) {
      return NextResponse.json(
        { valid: false, message: data.message || "Invalid security key." },
        { status: 403 }
      );
    }

    const siteProfile = normalizeAppProfile(data.app_profile) || "operations";
    const buildProfile = await resolveBuildProfile();
    if (buildProfile && buildProfile !== siteProfile) {
      return NextResponse.json(
        {
          valid: false,
          message: profileMismatchMessage(buildProfile),
          appProfile: siteProfile,
          planKey: data.plan_key || "",
        },
        { status: 403 }
      );
    }

    const clientName = String(data.client_name || "").trim();
    const clientLogo = String(data.client_logo || "").trim();
    const clientHero = String(data.client_hero || "").trim();
    const clientTagline = String(data.client_tagline || "").trim();
    const planKey = String(data.plan_key || "").trim();
    const response = NextResponse.json({
      valid: true,
      baseUrl,
      clientName,
      clientLogo,
      clientHero,
      clientTagline,
      planKey,
      appProfile: siteProfile,
    });
    response.cookies.set(COOKIE_BASE_URL, baseUrl, cookieOpts);
    response.cookies.set(COOKIE_SITE_PROFILE, siteProfile, {
      ...cookieOpts,
      httpOnly: false,
    });
    setOrClearCookie(response, COOKIE_CLIENT_NAME, clientName);
    setOrClearCookie(response, COOKIE_CLIENT_LOGO, clientLogo);
    setOrClearCookie(response, COOKIE_CLIENT_HERO, clientHero);
    setOrClearCookie(response, COOKIE_CLIENT_TAGLINE, clientTagline);
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        message: fetchErrorMessage(
          err,
          `${baseUrl}/wp-json/onesource/v1/mobile/verify-connect`
        ),
      },
      { status: 502 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}

function setOrClearCookie(
  response: NextResponse,
  name: string,
  value: string
) {
  if (value) {
    response.cookies.set(name, value, cookieOpts);
    return;
  }
  response.cookies.set(name, "", { ...cookieOpts, maxAge: 0 });
}
