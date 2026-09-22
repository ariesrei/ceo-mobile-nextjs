import { AppShell } from "@/components/AppShell";
import { ParcelForm } from "@/components/ParcelForm";
import { showOpsAssetsUi } from "@/lib/app-profile";
import { getServerClientBranding, requireAuth } from "@/lib/server-nav";
import { redirect } from "next/navigation";

export default async function NewEntryDeliveryPage() {
  await requireAuth();
  if (!showOpsAssetsUi()) redirect("/account/parcels/new");
  const branding = await getServerClientBranding();

  return (
    <AppShell
      title="Create a Delivery Pass"
      subtitle="Log a delivery or service drop-off."
      layout="community"
      backHref="/account/entry-pass"
      clientName={branding.name}
      clientLogo={branding.logo}
    >
      <ParcelForm afterSaveHref="/account/entry-pass" />
    </AppShell>
  );
}
