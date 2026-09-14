import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { publicWpErrorMessage } from "@/lib/wp-error";
import {
  apiUrl,
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_CLIENT_HERO,
  COOKIE_CLIENT_LOGO,
  COOKIE_CLIENT_NAME,
  COOKIE_FIRST_NAME,
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
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "");
  const password = String(body.password || "");
  const baseUrl = String(body.baseUrl || "").replace(/\/+$/, "");

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

    const response = NextResponse.json({
      user: data.user,
      expires_in: data.expires_in,
    });

    response.cookies.set(COOKIE_BASE_URL, baseUrl, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 365,
    });
    response.cookies.set(COOKIE_ACCESS, data.access_token, {
      ...cookieOpts,
      maxAge: data.expires_in || 3600,
    });
    response.cookies.set(COOKIE_REFRESH, data.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 30,
    });
    const clientName = String(data.user?.client_name || "").trim();
    const clientLogo = String(data.user?.client_logo || "").trim();
    const clientHero = String(data.user?.client_hero || "").trim();
    const firstName =
      String(data.user?.first_name || "").trim() ||
      String(data.user?.display_name || "")
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
    if (firstName) {
      response.cookies.set(COOKIE_FIRST_NAME, firstName, {
        ...cookieOpts,
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}
