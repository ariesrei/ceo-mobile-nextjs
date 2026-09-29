import { AppShell } from "@/components/AppShell";
import { GuestsList } from "@/components/GuestsList";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function GuestsPage() {
  await requireMenuPath("/account/guests");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Guests"
      subtitle={community ? undefined : "Check in and check out"}
      backHref="/account"
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <GuestsList />
    </AppShell>
  );
}
