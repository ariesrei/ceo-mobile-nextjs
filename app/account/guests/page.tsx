import { AppShell } from "@/components/AppShell";
import { GuestsList } from "@/components/GuestsList";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function GuestsPage() {
  if (showOpsAssetsUi()) redirect("/account/entry-pass");
  await requireMenuPath("/account/guests");
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
