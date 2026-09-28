import { AppShell } from "@/components/AppShell";
import { GuestsList } from "@/components/GuestsList";
import { getServerClientBranding, requireMenuPath, staffMenuDecision } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function GuestsPage() {
  const nav = await requireMenuPath("/account/guests");
  if (staffMenuDecision(nav, "/account/guests") === "resident") {
    redirect("/account/history?tab=guests");
  }
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Guests"
      subtitle="Check in and check out"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <GuestsList />
    </AppShell>
  );
}
