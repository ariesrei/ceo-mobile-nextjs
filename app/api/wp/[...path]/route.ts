import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applyAuthCookies, refreshWpTokens } from "@/lib/auth-session";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { publicWpErrorMessage } from "@/lib/wp-error";
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
  let access = jar.get(COOKIE_ACCESS)?.value || "";
  const refresh = jar.get(COOKIE_REFRESH)?.value || "";

  if (!baseUrl) {
    return NextResponse.json({ message: "Property not connected." }, { status: 400 });
  }
  if (!access && !refresh) {
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

    let freshTokens = null;
    if (!access && refresh) {
      freshTokens = await refreshWpTokens(baseUrl, refresh);
      if (!freshTokens) {
        return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
      }
      access = freshTokens.access_token;
    }

    let res = await doFetch(access);

    if (res.status === 401 && refresh) {
      freshTokens = await refreshWpTokens(baseUrl, refresh);
      if (freshTokens) {
        access = freshTokens.access_token;
        res = await doFetch(access);
      }
    }

    const payload = await res.text();
    let data: unknown = {};
    let status = res.status;
    try {
      data = payload ? JSON.parse(payload) : {};
    } catch {
      data = {
        message: publicWpErrorMessage(payload, `Request failed (${res.status})`),
      };
      if (status < 400) status = 502;
    }
    const response = NextResponse.json(data, { status });
    if (freshTokens) {
      applyAuthCookies(response, freshTokens);
    }
    return response;
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
