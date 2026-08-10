import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import {
  apiUrl,
  COOKIE_ACCESS,
  COOKIE_BASE_URL,
  COOKIE_REFRESH,
} from "@/lib/wp";

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const jar = await cookies();
  const baseUrl = jar.get(COOKIE_BASE_URL)?.value;
  let access = jar.get(COOKIE_ACCESS)?.value;
  const refresh = jar.get(COOKIE_REFRESH)?.value;

  if (!baseUrl) {
    return NextResponse.json({ message: "Property not connected." }, { status: 400 });
  }
  if (!access) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const url = new URL(request.url);
  const targetPath = `/app/${path.join("/")}${url.search}`;
  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  try {
    const doFetch = (token: string) =>
      serverFetch(apiUrl(baseUrl, targetPath), {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
        },
        body,
        cache: "no-store",
      });

    let res = await doFetch(access);

    if (res.status === 401 && refresh) {
      const refreshRes = await serverFetch(apiUrl(baseUrl, "/app/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: "no-store",
      });
      if (refreshRes.ok) {
        const tokens = (await refreshRes.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        access = tokens.access_token;
        res = await doFetch(access);

        const payload = await res.text();
        const response = new NextResponse(payload, {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        });
        response.cookies.set(COOKIE_ACCESS, tokens.access_token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: tokens.expires_in || 3600,
        });
        response.cookies.set(COOKIE_REFRESH, tokens.refresh_token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });
        return response;
      }
    }

    const payload = await res.text();
    return new NextResponse(payload, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
