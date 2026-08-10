import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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

export async function POST() {
  const jar = await cookies();
  const baseUrl = jar.get(COOKIE_BASE_URL)?.value;
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
