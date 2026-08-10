import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ACCESS, COOKIE_BASE_URL } from "@/lib/wp";

export default async function HomePage() {
  const jar = await cookies();
  if (!jar.get(COOKIE_BASE_URL)?.value) {
    redirect("/connect");
  }
  if (!jar.get(COOKIE_ACCESS)?.value) {
    redirect("/login");
  }
  redirect("/account");
}
