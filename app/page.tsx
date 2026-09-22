import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_APP_PROFILE, COOKIE_SITE_PROFILE, normalizeAppProfile } from "@/lib/app-profile";
import { postLoginPath } from "@/lib/brand";
import { COOKIE_ACCESS, COOKIE_BASE_URL } from "@/lib/wp";

export default async function HomePage() {
  const jar = await cookies();
  if (!jar.get(COOKIE_BASE_URL)?.value) {
    redirect("/connect");
  }
  if (!jar.get(COOKIE_ACCESS)?.value) {
    redirect("/login");
  }
  const profile =
    normalizeAppProfile(jar.get(COOKIE_SITE_PROFILE)?.value) ||
    normalizeAppProfile(jar.get(COOKIE_APP_PROFILE)?.value);
  redirect(postLoginPath(profile));
}
