import { redirect } from "next/navigation";
import { normalizeAppProfile } from "@/lib/app-profile";

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
  redirect("/");
}
