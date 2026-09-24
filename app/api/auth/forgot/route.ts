import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { apiUrl, COOKIE_BASE_URL } from "@/lib/wp";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = String(body.username || body.user_login || "").trim();
  const jar = await cookies();
  const baseUrl = String(body.baseUrl || jar.get(COOKIE_BASE_URL)?.value || "").replace(
    /\/+$/,
    ""
  );

  if (!username || !baseUrl) {
    return NextResponse.json(
      { message: "Username or email, and property URL, are required." },
      { status: 400 }
    );
  }

  try {
    const res = await serverFetch(apiUrl(baseUrl, "/app/auth/forgot"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username }),
      cache: "no-store",
    });
    const rawBody = await res.text();
    const data = (() => {
      try {
        return JSON.parse(rawBody) as { message?: string };
      } catch {
        return { message: rawBody };
      }
    })();
    if (!res.ok) {
      return NextResponse.json(
        { message: publicWpErrorMessage(data.message, "Could not send reset email.") },
        { status: res.status }
      );
    }
    return NextResponse.json({
      message:
        data.message ||
        "If an account exists for that username or email, you will receive a password reset link shortly.",
    });
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}
