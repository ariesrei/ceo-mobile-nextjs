import { NextResponse } from "next/server";
import { COOKIE_CLIENT_LOGO, COOKIE_CLIENT_NAME } from "@/lib/wp";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

/** Persist WordPress site/client name (+ optional logo) for SSR pages. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const clientName = String(body.clientName || "").trim();
  const clientLogo = String(body.clientLogo || "").trim();
  if (!clientName || clientName === "Client") {
    return NextResponse.json({ message: "Invalid client name." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, clientName, clientLogo });
  response.cookies.set(COOKIE_CLIENT_NAME, clientName, cookieOpts);
  if (clientLogo) {
    response.cookies.set(COOKIE_CLIENT_LOGO, clientLogo, cookieOpts);
  }
  return response;
}
