import { AppShell } from "@/components/AppShell";
import { ParcelsList } from "@/components/ParcelsList";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function ParcelsPage() {
  await requireMenuPath("/account/parcels");
  const branding = await getServerClientBranding();
  const community = showOpsAssetsUi();

  return (
    <AppShell
      title="Packages"
      subtitle={community ? undefined : "Deliveries in storage"}
      backHref={community ? undefined : "/account"}
      layout={community ? "community" : "default"}
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ParcelsList />
    </AppShell>
  );
}
