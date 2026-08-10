import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { ParcelForm } from "@/components/ParcelForm";
import { getServerClientBranding, requireMenuPath } from "@/lib/server-nav";

export default async function NewParcelPage() {
  await requireMenuPath("/account/parcels");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="New parcel"
      subtitle="Log a delivery for a unit"
      backHref="/account/parcels"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <Card>
        <ParcelForm />
      </Card>
    </AppShell>
  );
}
