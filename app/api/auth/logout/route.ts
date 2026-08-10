import { NextResponse } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/wp";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_ACCESS, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(COOKIE_REFRESH, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
