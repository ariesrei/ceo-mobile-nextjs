import { redirect } from "next/navigation";
import { requireMenuPath } from "@/lib/server-nav";

export default async function MessagingThreadPage() {
  await requireMenuPath("/account/messaging");
  redirect("/account/messaging");
}
