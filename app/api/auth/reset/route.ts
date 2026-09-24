import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { publicWpErrorMessage } from "@/lib/wp-error";
import { apiUrl, COOKIE_BASE_URL } from "@/lib/wp";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(body.key || "").trim();
  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  const passwordConfirm = String(body.password_confirm || body.confirm_password || "");
  const jar = await cookies();
  const baseUrl = String(body.baseUrl || jar.get(COOKIE_BASE_URL)?.value || "").replace(
    /\/+$/,
    ""
  );

  if (!key || !login || !password || !baseUrl) {
    return NextResponse.json(
      { message: "Reset link and new password are required." },
      { status: 400 }
    );
  }

  try {
    const res = await serverFetch(apiUrl(baseUrl, "/app/auth/reset"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        key,
        login,
        password,
        password_confirm: passwordConfirm,
      }),
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
        { message: publicWpErrorMessage(data.message, "Could not reset password.") },
        { status: res.status }
      );
    }
    return NextResponse.json({
      message: data.message || "Password reset. You can sign in now.",
    });
  } catch (err) {
    return NextResponse.json({ message: fetchErrorMessage(err) }, { status: 502 });
  }
}
