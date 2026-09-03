import { NextResponse } from "next/server";
import { fetchErrorMessage, serverFetch } from "@/lib/server-fetch";
import { COOKIE_BASE_URL, COOKIE_CLIENT_LOGO, COOKIE_CLIENT_NAME } from "@/lib/wp";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

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
    };

    if (!res.ok || !data.valid) {
      return NextResponse.json(
        { valid: false, message: data.message || "Invalid security key." },
        { status: 403 }
      );
    }

    const clientName = String(data.client_name || "").trim();
    const clientLogo = String(data.client_logo || "").trim();
    const response = NextResponse.json({
      valid: true,
      baseUrl,
      clientName,
      clientLogo,
    });
    response.cookies.set(COOKIE_BASE_URL, baseUrl, cookieOpts);
    if (clientName) {
      response.cookies.set(COOKIE_CLIENT_NAME, clientName, cookieOpts);
    }
    if (clientLogo) {
      response.cookies.set(COOKIE_CLIENT_LOGO, clientLogo, cookieOpts);
    }
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
