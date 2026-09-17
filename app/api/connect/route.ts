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
import { normalizeSecurityKey } from "@/lib/connect";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import {
  connectVerifyErrorMessage,
  parseConnectVerifyBody,
  verifyConnectUrl,
  type ConnectVerifyResult,
} from "@/lib/verify-connect";
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

function brandingFromBody(body: Record<string, unknown>): ConnectVerifyResult {
  return {
    valid: true,
    client_name: String(body.clientName || body.client_name || ""),
    client_logo: String(body.clientLogo || body.client_logo || ""),
    client_hero: String(body.clientHero || body.client_hero || ""),
    client_tagline: String(body.clientTagline || body.client_tagline || ""),
    plan_key: String(body.planKey || body.plan_key || ""),
    app_profile: String(body.appProfile || body.app_profile || ""),
  };
}

async function finishConnect(baseUrl: string, data: ConnectVerifyResult) {
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
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const baseUrl = String(body.baseUrl || "").replace(/\/+$/, "");
  const securityKey = normalizeSecurityKey(
    String(body.securityKey || body.ceo_mobile_connect_key || "")
  );
  const browserVerified = body.browserVerified === true;

  if (!baseUrl) {
    return NextResponse.json(
      { message: "URL and security key are required." },
      { status: 400 }
    );
  }

  // Phone/browser already talked to WordPress (Vercel IPs are often WAF-blocked).
  if (browserVerified) {
    return finishConnect(baseUrl, brandingFromBody(body));
  }

  if (!securityKey) {
    return NextResponse.json(
      { message: "URL and security key are required." },
      { status: 400 }
    );
  }

  try {
    const res = await serverFetch(verifyConnectUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CE-OneSource-Mobile/1.0",
      },
      body: JSON.stringify({ security_key: securityKey }),
      cache: "no-store",
    });

    const rawBody = await res.text();
    const data = parseConnectVerifyBody(rawBody);

    if (!res.ok || !data.valid) {
      return NextResponse.json(
        {
          valid: false,
          message: connectVerifyErrorMessage(res.status, rawBody, data),
          code: data.code || "",
        },
        { status: res.status >= 400 ? res.status : 403 }
      );
    }

    return finishConnect(baseUrl, data);
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        message: fetchErrorMessage(err, verifyConnectUrl(baseUrl)),
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
