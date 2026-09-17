import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { publicWpErrorMessage } from "@/lib/wp-error";
import {
  getBuildAppProfile,
  profileMismatchMessage,
} from "@/lib/app-profile";
import {
  applyAuthCookies,
  siteProfileFromUser,
  tokensFromBody,
} from "@/lib/auth-session";
import { apiUrl, COOKIE_BASE_URL } from "@/lib/wp";
import type { AuthTokens, AppUser } from "@/lib/types";

function finishLogin(
  baseUrl: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: AppUser;
  },
  buildProfile: ReturnType<typeof getBuildAppProfile>
) {
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.json({ message: "Login failed." }, { status: 502 });
  }

  const siteProfile = siteProfileFromUser(tokens.user, baseUrl);
  if (buildProfile && buildProfile !== siteProfile) {
    return NextResponse.json(
      { message: profileMismatchMessage(buildProfile) },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    user: tokens.user,
    expires_in: tokens.expires_in,
    appProfile: siteProfile,
  });
  applyAuthCookies(response, {
    baseUrl,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in || 3600,
    user: tokens.user,
    siteProfile,
  });
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = String(body.username || "");
  const password = String(body.password || "");
  const jar = await cookies();
  const baseUrl = String(body.baseUrl || jar.get(COOKIE_BASE_URL)?.value || "").replace(
    /\/+$/,
    ""
  );
  const browserVerified = body.browserVerified === true;
  const buildProfile = getBuildAppProfile();

  if (browserVerified) {
    const tokens = tokensFromBody(body);
    if (!baseUrl || !tokens.access_token || !tokens.refresh_token) {
      return NextResponse.json(
        { message: "Username, password, and property URL are required." },
        { status: 400 }
      );
    }
    return finishLogin(baseUrl, tokens, buildProfile);
  }

  if (!username || !password || !baseUrl) {
    return NextResponse.json(
      { message: "Username, password, and property URL are required." },
      { status: 400 }
    );
  }

  try {
    const res = await serverFetch(apiUrl(baseUrl, "/app/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    const rawBody = await res.text();
    const data = (() => {
      try {
        return JSON.parse(rawBody) as AuthTokens & {
          message?: string;
          code?: string;
        };
      } catch {
        return { message: rawBody } as AuthTokens & { message?: string };
      }
    })();

    if (!res.ok) {
      return NextResponse.json(
        { message: publicWpErrorMessage(data.message, "Login failed.") },
        { status: res.status }
      );
    }

    return finishLogin(baseUrl, data, buildProfile);
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}
