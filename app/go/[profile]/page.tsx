import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeAppProfile } from "@/lib/app-profile";
import { COOKIE_ACCESS, COOKIE_BASE_URL } from "@/lib/wp";

export default async function GoProfilePage({
  params,
}: {
  params: Promise<{ profile: string }>;
}) {
  const { profile } = await params;
  const normalized = normalizeAppProfile(profile);
  if (!normalized) {
    redirect("/connect");
  }

  const jar = await cookies();
  if (jar.get(COOKIE_ACCESS)?.value) {
    redirect("/account");
  }
  if (jar.get(COOKIE_BASE_URL)?.value) {
    redirect("/login");
  }
  redirect("/connect");
}
