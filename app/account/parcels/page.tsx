import { AppShell } from "@/components/AppShell";
import { ParcelsList } from "@/components/ParcelsList";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function ParcelsPage() {
  await requireMenuPath("/account/parcels");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Parcels"
      subtitle="Deliveries in storage"
      backHref="/account"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ParcelsList />
    </AppShell>
  );
}
